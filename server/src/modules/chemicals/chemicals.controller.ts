import { Request, Response, NextFunction } from 'express';
import { ChemicalsService } from './chemicals.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const chemicalsService = new ChemicalsService();

export class ChemicalsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
        lowStock: req.query.lowStock === 'true',
      };
      const { data, total } = await chemicalsService.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const chemical = await chemicalsService.getById(Number(req.params.id));
      sendSuccess(res, chemical);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const chemical = await chemicalsService.create(req.body);
      sendCreated(res, chemical, 'Chemical added successfully');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const chemical = await chemicalsService.update(Number(req.params.id), req.body);
      sendSuccess(res, chemical, 'Chemical updated');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await chemicalsService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Chemical deleted');
    } catch (err) { next(err); }
  }

  async logUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const usage = await chemicalsService.logUsage(req.body, req.user?.userId);
      sendCreated(res, usage, 'Chemical usage logged');
    } catch (err) { next(err); }
  }

  async getUsageLog(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        chemicalId: req.query.chemicalId ? Number(req.query.chemicalId) : undefined,
        pondId: req.query.pondId ? Number(req.query.pondId) : undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const { data, total } = await chemicalsService.getUsageLog(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async updateUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const usage = await chemicalsService.updateUsage(Number(req.params.id), req.body);
      sendSuccess(res, usage, 'Usage record updated');
    } catch (err) { next(err); }
  }

  async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await chemicalsService.getLowStockAlerts();
      sendSuccess(res, alerts);
    } catch (err) { next(err); }
  }
}
