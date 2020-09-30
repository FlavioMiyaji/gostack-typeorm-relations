import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Could not find any customer with the given id!', 400);
    }
    const foundProducts = await this.productsRepository.findAllById(products);
    if (!foundProducts || foundProducts.length !== products.length) {
      throw new AppError('Could not find all products with the given ids!');
    }
    const existentIds = foundProducts.map(product => product.id);
    const inexistentProducts = products.filter(
      product => !existentIds.includes(product.id),
    );
    if (inexistentProducts.length) {
      throw new AppError(`Could not find product ${inexistentProducts[0].id}`);
    }
    const unavailableProducts = products.filter(product => {
      const found = foundProducts.find(({ id }) => id === product.id);
      if (!found) return true;
      return found.quantity <= product.quantity;
    });
    if (unavailableProducts.length) {
      const product = unavailableProducts[0];
      throw new AppError(
        `The quantity ${product.quantity} it not available for ${product.id}.`,
      );
    }
    const list = products.map(product => {
      const found = foundProducts.find(({ id }) => product.id === id);
      return {
        product_id: product.id,
        price: found ? found.price : 0.0,
        quantity: product.quantity,
      };
    });

    const orderedProductsQuantity = products.map(product => {
      const found = foundProducts.find(({ id }) => id === product.id);
      return {
        id: product.id,
        quantity: !found ? 0 : found.quantity - product.quantity,
      };
    });
    await this.productsRepository.updateQuantity(orderedProductsQuantity);
    return this.ordersRepository.create({
      customer,
      products: list,
    });
  }
}

export default CreateOrderService;
