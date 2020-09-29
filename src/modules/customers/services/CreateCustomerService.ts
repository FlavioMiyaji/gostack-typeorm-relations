import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    if (!name) {
      throw new AppError('Name is a required field!', 422);
    }
    if (!email) {
      throw new AppError('E-mail is a required field!', 422);
    }
    const found = await this.customersRepository.findByEmail(email);
    if (found) {
      throw new AppError('E-mail has aready been used!', 400);
    }
    return this.customersRepository.create({ name, email });
  }
}

export default CreateCustomerService;
