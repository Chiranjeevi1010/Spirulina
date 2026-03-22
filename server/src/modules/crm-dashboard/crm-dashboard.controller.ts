import { Request, Response, NextFunction } from 'express';
import { CrmDashboardService } from './crm-dashboard.service.js';
import { sendSuccess } from '../../utils/api-response.util.js';

const service = new CrmDashboardService();

export class CrmDashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await service.getSummary(req.user?.userId);
      sendSuccess(res, summary);
    } catch (err) { next(err); }
  }
}
