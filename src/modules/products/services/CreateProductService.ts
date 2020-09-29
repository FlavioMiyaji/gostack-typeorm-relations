import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    if (!name) {
      throw new AppError('Name is a required field!', 422);
    }
    if (!price) {
      throw new AppError('Price is a required field!', 422);
    }
    if (!quantity) {
      throw new AppError('Quantity is a required field!', 422);
    }
    const found = await this.productsRepository.findByName(name);
    if (found) {
      throw new AppError('Product has aready been registered!', 400);
    }
    return this.productsRepository.create({
      name,
      price,
      quantity,
    });
  }
}

export default CreateProductService;
