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
      throw new AppError('Curtomer not found!', 400);
    }
    const foundProducts = await this.productsRepository.findAllById(products);
    if (!foundProducts || foundProducts.length !== products.length) {
      throw new AppError('Products not found!', 400);
    }
    const list = [] as {
      product_id: string;
      price: number;
      quantity: number;
    }[];
    products.forEach(({ id, quantity }) => {
      const found = foundProducts.find(product => product.id === id);
      if (!found) {
        throw new AppError('Products not found!', 400);
      }
      if (found.quantity <= quantity) {
        throw new AppError('Not enough availability balance!', 400);
      }
      list.push({
        product_id: id,
        price: found.price,
        quantity,
      });
    });
    await this.productsRepository.updateQuantity(
      list.map(({ product_id, quantity }) => ({
        id: product_id,
        quantity,
      })),
    );
    return this.ordersRepository.create({
      customer,
      products: list,
    });
  }
}

export default CreateOrderService;
