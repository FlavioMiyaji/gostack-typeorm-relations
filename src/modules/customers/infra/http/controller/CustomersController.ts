import { container } from 'tsyringe';
import { Request, Response } from 'express';

import CreateCustomerService from '@modules/customers/services/CreateCustomerService';

export default class CustomersController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { email, name } = request.body;
    const createCustomer = container.resolve(CreateCustomerService);
    const customer = await createCustomer.execute({
      email,
      name,
    });
    return response.status(200).json(customer);
  }
}
