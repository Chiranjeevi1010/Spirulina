import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../utils/api-response.util.js';

const dashboardService = new DashboardService();

export class DashboardController {
  async getKPIs(req: Request, res: Response, next: NextFunction) {
    try {
      const kpis = await dashboardService.getKPIs();
      sendSuccess(res, kpis);
    } catch (err) { next(err); }
  }

  async getRecentActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const activities = await dashboardService.getRecentActivities();
      sendSuccess(res, activities);
    } catch (err) { next(err); }
  }
}
