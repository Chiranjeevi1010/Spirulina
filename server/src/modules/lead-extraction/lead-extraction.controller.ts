import { Request, Response, NextFunction } from 'express';
import { LeadExtractionService } from './lead-extraction.service.js';
import { sendSuccess, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const service = new LeadExtractionService();

export class LeadExtractionController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
      };
      const { data, total } = await service.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await service.getById(Number(req.params.id));
      sendSuccess(res, lead);
    } catch (err) { next(err); }
  }

  async review(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.review(
        Number(req.params.id),
        req.body.status,
        req.body.notes,
        req.user!.userId,
      );
      sendSuccess(res, result, `Lead ${req.body.status}`);
    } catch (err) { next(err); }
  }

  async bulkReview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.bulkReview(
        req.body.ids,
        req.body.status,
        req.user!.userId,
      );
      sendSuccess(res, result, 'Bulk review completed');
    } catch (err) { next(err); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.getStats();
      sendSuccess(res, stats);
    } catch (err) { next(err); }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await service.getExtractionHistory();
      sendSuccess(res, history);
    } catch (err) { next(err); }
  }

  async triggerExtraction(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await service.extractLeads();
      sendSuccess(res, { count }, `Extracted ${count} new leads`);
    } catch (err) { next(err); }
  }
}
