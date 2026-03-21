import { Request, Response, NextFunction } from 'express';
import { PondsService } from './ponds.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const pondsService = new PondsService();

export class PondsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        status: req.query.status as string | undefined,
        healthStatus: req.query.healthStatus as string | undefined,
        search: req.query.search as string | undefined,
      };

      const { data, total } = await pondsService.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const pond = await pondsService.getById(Number(req.params.id));
      sendSuccess(res, pond);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const pond = await pondsService.create(req.body, req.user?.userId);
      sendCreated(res, pond, 'Pond created successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const pond = await pondsService.update(Number(req.params.id), req.body);
      sendSuccess(res, pond, 'Pond updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await pondsService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Pond deactivated successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const pond = await pondsService.updateStatus(Number(req.params.id), req.body.status);
      sendSuccess(res, pond, 'Pond status updated');
    } catch (err) {
      next(err);
    }
  }

  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await pondsService.getOverview();
      sendSuccess(res, overview);
    } catch (err) {
      next(err);
    }
  }
}
