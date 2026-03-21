import { Request, Response, NextFunction } from 'express';
import { HarvestService } from './harvest.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const harvestService = new HarvestService();

export class HarvestController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        pondId: req.query.pondId ? Number(req.query.pondId) : undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const { data, total } = await harvestService.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const harvest = await harvestService.getById(Number(req.params.id));
      sendSuccess(res, harvest);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const harvest = await harvestService.create(req.body, req.user?.userId);
      sendCreated(res, harvest, 'Harvest recorded successfully');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const harvest = await harvestService.update(Number(req.params.id), req.body);
      sendSuccess(res, harvest, 'Harvest updated successfully');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await harvestService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Harvest record deleted');
    } catch (err) { next(err); }
  }

  async getByPond(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit) || 10;
      const data = await harvestService.getByPond(Number(req.params.pondId), limit);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await harvestService.getStats(
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined,
      );
      sendSuccess(res, stats);
    } catch (err) { next(err); }
  }
}
