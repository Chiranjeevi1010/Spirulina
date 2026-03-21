import { Request, Response, NextFunction } from 'express';
import { WhatsAppService } from './whatsapp.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { sendSuccess, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const whatsappService = new WhatsAppService();
const settingsService = new SettingsService();

export class WhatsAppController {
  async getConfig(_req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await settingsService.getByCategory('whatsapp');
      const config: Record<string, unknown> = {};
      for (const row of rows) {
        config[row.key] = row.value;
      }
      sendSuccess(res, config);
    } catch (err) { next(err); }
  }

  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const entries = req.body as Record<string, unknown>;

      for (const [key, value] of Object.entries(entries)) {
        await settingsService.upsert('whatsapp', key, value, `WhatsApp ${key}`, userId);
      }

      sendSuccess(res, null, 'WhatsApp configuration updated');
    } catch (err) { next(err); }
  }

  async getLog(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const orderId = req.query.orderId ? Number(req.query.orderId) : undefined;

      const { data, total } = await whatsappService.getLog(page, limit, orderId);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getLogByOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await whatsappService.getLogByOrder(Number(req.params.orderId));
      sendSuccess(res, logs);
    } catch (err) { next(err); }
  }

  async sendTestMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;
      if (!phone) {
        return sendSuccess(res, { success: false, error: 'Phone number is required' });
      }
      const result = await whatsappService.sendTestMessage(phone);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }
}
