import { Request, Response, NextFunction } from 'express';
import { ProductionService } from './production.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const productionService = new ProductionService();

export class ProductionController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        dryerType: req.query.dryerType as string | undefined,
      };
      const { data, total } = await productionService.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await productionService.getById(Number(req.params.id));
      sendSuccess(res, record);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await productionService.create(req.body, req.user?.userId);
      sendCreated(res, record, 'Production record created');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await productionService.update(Number(req.params.id), req.body);
      sendSuccess(res, record, 'Production record updated');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await productionService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Production record deleted');
    } catch (err) { next(err); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await productionService.getEfficiencyStats(
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined,
      );
      sendSuccess(res, stats);
    } catch (err) { next(err); }
  }
}
