import { Request, Response, NextFunction } from 'express';
import { MarketingService } from './marketing.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const marketingService = new MarketingService();

export class MarketingController {
  async listDemoFarms(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = { status: req.query.status as string | undefined };
      const { data, total } = await marketingService.listDemoFarms(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getDemoFarm(req: Request, res: Response, next: NextFunction) {
    try {
      const farm = await marketingService.getDemoFarmById(Number(req.params.id));
      sendSuccess(res, farm);
    } catch (err) { next(err); }
  }

  async createDemoFarm(req: Request, res: Response, next: NextFunction) {
    try {
      const farm = await marketingService.createDemoFarm(req.body, req.user?.userId);
      sendCreated(res, farm, 'Demo farm created');
    } catch (err) { next(err); }
  }

  async updateDemoFarm(req: Request, res: Response, next: NextFunction) {
    try {
      const farm = await marketingService.updateDemoFarm(Number(req.params.id), req.body);
      sendSuccess(res, farm, 'Demo farm updated');
    } catch (err) { next(err); }
  }

  async deleteDemoFarm(req: Request, res: Response, next: NextFunction) {
    try {
      await marketingService.deleteDemoFarm(Number(req.params.id));
      sendSuccess(res, null, 'Demo farm deleted');
    } catch (err) { next(err); }
  }

  async listTestimonials(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        isPublished: req.query.isPublished !== undefined ? req.query.isPublished === 'true' : undefined,
      };
      const { data, total } = await marketingService.listTestimonials(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async createTestimonial(req: Request, res: Response, next: NextFunction) {
    try {
      const t = await marketingService.createTestimonial(req.body);
      sendCreated(res, t, 'Testimonial added');
    } catch (err) { next(err); }
  }

  async updateTestimonial(req: Request, res: Response, next: NextFunction) {
    try {
      const t = await marketingService.updateTestimonial(Number(req.params.id), req.body);
      sendSuccess(res, t, 'Testimonial updated');
    } catch (err) { next(err); }
  }

  async publishTestimonial(req: Request, res: Response, next: NextFunction) {
    try {
      const t = await marketingService.publishTestimonial(Number(req.params.id), req.user!.userId);
      sendSuccess(res, t, 'Testimonial published');
    } catch (err) { next(err); }
  }

  async deleteTestimonial(req: Request, res: Response, next: NextFunction) {
    try {
      await marketingService.deleteTestimonial(Number(req.params.id));
      sendSuccess(res, null, 'Testimonial deleted');
    } catch (err) { next(err); }
  }
}
