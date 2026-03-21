import { Request, Response, NextFunction } from 'express';
import { OrdersService } from './orders.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const ordersService = new OrdersService();

export class OrdersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
        status: req.query.status as string | undefined,
        paymentStatus: req.query.paymentStatus as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const { data, total } = await ordersService.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.getById(Number(req.params.id));
      sendSuccess(res, order);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.create(req.body, req.user?.userId);
      sendCreated(res, order, 'Order created');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.update(Number(req.params.id), req.body);
      sendSuccess(res, order, 'Order updated');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ordersService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Order deleted');
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.updateStatus(Number(req.params.id), req.body.status);
      sendSuccess(res, order, 'Order status updated');
    } catch (err) { next(err); }
  }

  async updatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await ordersService.updatePayment(Number(req.params.id), req.body);
      sendSuccess(res, order, 'Payment updated');
    } catch (err) { next(err); }
  }

  async getRevenueSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await ordersService.getRevenueSummary(
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined,
      );
      sendSuccess(res, summary);
    } catch (err) { next(err); }
  }
}
