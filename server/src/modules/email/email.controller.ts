import { Request, Response, NextFunction } from 'express';
import { EmailService } from './email.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const service = new EmailService();

export class EmailController {
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await service.getConfig();
      sendSuccess(res, config);
    } catch (err) { next(err); }
  }

  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      await service.updateConfig(req.body, req.user!.userId);
      sendSuccess(res, null, 'Email configuration updated');
    } catch (err) { next(err); }
  }

  async testConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.testConnection();
      sendSuccess(res, result, result.success ? 'Connection successful' : 'Connection failed');
    } catch (err) { next(err); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await service.getStats();
      sendSuccess(res, stats);
    } catch (err) { next(err); }
  }

  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.sendEmail(req.body, req.user!.userId);
      sendCreated(res, result, 'Email sent');
    } catch (err) { next(err); }
  }

  async bulkSend(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.bulkSend(req.body.leadIds, req.body.templateId, req.user!.userId);
      sendSuccess(res, result, 'Bulk email completed');
    } catch (err) { next(err); }
  }

  async getLog(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = { status: req.query.status as string | undefined };
      const { data, total } = await service.getLog(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await service.listTemplates();
      sendSuccess(res, templates);
    } catch (err) { next(err); }
  }

  async getTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await service.getTemplate(Number(req.params.id));
      sendSuccess(res, template);
    } catch (err) { next(err); }
  }

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await service.createTemplate(req.body, req.user!.userId);
      sendCreated(res, template, 'Template created');
    } catch (err) { next(err); }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await service.updateTemplate(Number(req.params.id), req.body);
      sendSuccess(res, template, 'Template updated');
    } catch (err) { next(err); }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      await service.deleteTemplate(Number(req.params.id));
      sendSuccess(res, null, 'Template deleted');
    } catch (err) { next(err); }
  }
}
