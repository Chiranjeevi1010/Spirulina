import { Request, Response, NextFunction } from 'express';
import { CallTrackerService } from './call-tracker.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const service = new CallTrackerService();

export class CallTrackerController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        callerUserId: req.query.callerUserId ? Number(req.query.callerUserId) : undefined,
        leadId: req.query.leadId ? Number(req.query.leadId) : undefined,
        customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
        outcome: req.query.outcome as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const { data, total } = await service.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await service.getById(Number(req.params.id));
      sendSuccess(res, log);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await service.create(req.body, req.user!.userId);
      sendCreated(res, log, 'Call logged');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await service.update(Number(req.params.id), req.body);
      sendSuccess(res, log, 'Call log updated');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(Number(req.params.id));
      sendSuccess(res, null, 'Call log deleted');
    } catch (err) { next(err); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const stats = await service.getStats(userId);
      sendSuccess(res, stats);
    } catch (err) { next(err); }
  }

  async getDailyTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const target = await service.getDailyTarget(req.user!.userId);
      sendSuccess(res, target);
    } catch (err) { next(err); }
  }

  async getFollowUps(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.all ? undefined : req.user!.userId;
      const followUps = await service.getPendingFollowUps(userId);
      sendSuccess(res, followUps);
    } catch (err) { next(err); }
  }

  async completeFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await service.completeFollowUp(Number(req.params.id));
      sendSuccess(res, log, 'Follow-up completed');
    } catch (err) { next(err); }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await service.getAnalytics(
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined,
      );
      sendSuccess(res, analytics);
    } catch (err) { next(err); }
  }
}
