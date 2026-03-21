import { Request, Response, NextFunction } from 'express';
import { LeadsService } from './leads.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const leadsService = new LeadsService();

export class LeadsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        status: req.query.status as string | undefined,
        assignedTo: req.query.assignedTo ? Number(req.query.assignedTo) : undefined,
        search: req.query.search as string | undefined,
      };
      const { data, total } = await leadsService.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await leadsService.getById(Number(req.params.id));
      sendSuccess(res, lead);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await leadsService.create(req.body, req.user?.userId);
      sendCreated(res, lead, 'Lead created');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await leadsService.update(Number(req.params.id), req.body);
      sendSuccess(res, lead, 'Lead updated');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await leadsService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Lead deleted');
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await leadsService.updateStatus(Number(req.params.id), req.body.status);
      sendSuccess(res, lead, 'Lead status updated');
    } catch (err) { next(err); }
  }

  async convertToCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await leadsService.convertToCustomer(Number(req.params.id));
      sendCreated(res, customer, 'Lead converted to customer');
    } catch (err) { next(err); }
  }

  async getPipeline(req: Request, res: Response, next: NextFunction) {
    try {
      const pipeline = await leadsService.getByStatus();
      sendSuccess(res, pipeline);
    } catch (err) { next(err); }
  }
}
