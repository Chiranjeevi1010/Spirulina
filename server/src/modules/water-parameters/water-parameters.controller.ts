import { Request, Response, NextFunction } from 'express';
import { WaterParametersService } from './water-parameters.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const service = new WaterParametersService();

export class WaterParametersController {
  /**
   * GET /:pondId/readings
   * List water parameter readings for a pond with pagination and optional date range.
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pondId = Number(req.params.pondId);
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      const { data, total } = await service.list(pondId, page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /:pondId/readings/latest
   * Get the most recent reading for a pond.
   */
  async getLatest(req: Request, res: Response, next: NextFunction) {
    try {
      const pondId = Number(req.params.pondId);
      const reading = await service.getLatest(pondId);
      sendSuccess(res, reading);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /:pondId/readings/trends
   * Get trend data for a specific parameter over a date range.
   * Query params: parameter (required), startDate, endDate
   */
  async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const pondId = Number(req.params.pondId);
      const parameter = req.query.parameter as string;

      if (!parameter) {
        return sendSuccess(res, null, 'Query parameter "parameter" is required');
      }

      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const data = await service.getTrends(pondId, parameter, startDate, endDate);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /:pondId/readings/:id
   * Get a single reading by ID.
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const reading = await service.getById(Number(req.params.id));
      sendSuccess(res, reading);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /:pondId/readings
   * Create a new water parameter reading with automatic risk calculation.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const pondId = Number(req.params.pondId);
      const reading = await service.create(pondId, req.body, req.user?.userId);
      sendCreated(res, reading, 'Water parameter reading created successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /:pondId/readings/:id
   * Update a reading with risk recalculation.
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const reading = await service.update(Number(req.params.id), req.body);
      sendSuccess(res, reading, 'Water parameter reading updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /:pondId/readings/:id
   * Delete a reading.
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(Number(req.params.id));
      sendSuccess(res, null, 'Water parameter reading deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /alerts
   * Get all active parameter alerts (readings where any risk is RED or YELLOW).
   */
  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await service.getAlerts();
      sendSuccess(res, alerts);
    } catch (err) {
      next(err);
    }
  }
}
