import { Request, Response, NextFunction } from 'express';
import { BatchesService } from './batches.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const batchesService = new BatchesService();

export class BatchesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        productType: req.query.productType as string | undefined,
        status: req.query.status as string | undefined,
        sourcePondId: req.query.sourcePondId ? Number(req.query.sourcePondId) : undefined,
      };
      const { data, total } = await batchesService.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await batchesService.getById(Number(req.params.id));
      sendSuccess(res, batch);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await batchesService.create(req.body, req.user?.userId);
      sendCreated(res, batch, 'Batch created');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await batchesService.update(Number(req.params.id), req.body);
      sendSuccess(res, batch, 'Batch updated');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await batchesService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Batch deleted');
    } catch (err) { next(err); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await batchesService.updateStatus(Number(req.params.id), req.body.status);
      sendSuccess(res, batch, 'Batch status updated');
    } catch (err) { next(err); }
  }

  async addTest(req: Request, res: Response, next: NextFunction) {
    try {
      const test = await batchesService.addTest(Number(req.params.id), req.body, req.user?.userId);
      sendCreated(res, test, 'Test result added');
    } catch (err) { next(err); }
  }

  async getTests(req: Request, res: Response, next: NextFunction) {
    try {
      const tests = await batchesService.getTests(Number(req.params.id));
      sendSuccess(res, tests);
    } catch (err) { next(err); }
  }

  async getExpiring(req: Request, res: Response, next: NextFunction) {
    try {
      const days = Number(req.query.days) || 30;
      const batches = await batchesService.getExpiringBatches(days);
      sendSuccess(res, batches);
    } catch (err) { next(err); }
  }
}
