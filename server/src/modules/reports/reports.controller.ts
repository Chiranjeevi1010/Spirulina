import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service.js';
import { sendSuccess } from '../../utils/api-response.util.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

const reportsService = new ReportsService();

export class ReportsController {
  async getProductionReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) throw new AppError('startDate and endDate are required', 400);
      const report = await reportsService.getProductionReport(startDate as string, endDate as string);
      sendSuccess(res, report);
    } catch (err) { next(err); }
  }

  async getSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) throw new AppError('startDate and endDate are required', 400);
      const report = await reportsService.getSalesReport(startDate as string, endDate as string);
      sendSuccess(res, report);
    } catch (err) { next(err); }
  }

  async getExpenseReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) throw new AppError('startDate and endDate are required', 400);
      const report = await reportsService.getExpenseReport(startDate as string, endDate as string);
      sendSuccess(res, report);
    } catch (err) { next(err); }
  }
}
