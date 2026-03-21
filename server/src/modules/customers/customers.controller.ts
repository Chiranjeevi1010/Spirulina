import { Request, Response, NextFunction } from 'express';
import { CustomersService } from './customers.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const customersService = new CustomersService();

export class CustomersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        customerType: req.query.customerType as string | undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string | undefined,
      };
      const { data, total } = await customersService.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.getById(Number(req.params.id));
      sendSuccess(res, customer);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.create(req.body, req.user?.userId);
      sendCreated(res, customer, 'Customer created');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.update(Number(req.params.id), req.body);
      sendSuccess(res, customer, 'Customer updated');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await customersService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Customer deactivated');
    } catch (err) { next(err); }
  }

  async getOrderHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await customersService.getOrderHistory(Number(req.params.id));
      sendSuccess(res, orders);
    } catch (err) { next(err); }
  }
}
