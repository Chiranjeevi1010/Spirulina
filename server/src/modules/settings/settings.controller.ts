import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.util.js';

const settingsService = new SettingsService();

export class SettingsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.getAll();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.getByCategory(req.params.category);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await settingsService.get(req.params.category, req.params.key);
      sendSuccess(res, setting);
    } catch (err) { next(err); }
  }

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, key, value, description } = req.body;
      const setting = await settingsService.upsert(category, key, value, description, req.user?.userId);
      sendSuccess(res, setting, 'Setting updated');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await settingsService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Setting deleted');
    } catch (err) { next(err); }
  }
}
