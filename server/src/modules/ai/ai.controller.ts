import { Request, Response, NextFunction } from 'express';
import { AIService } from './ai.service.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.util.js';

const aiService = new AIService();

export class AIController {
  // Farm Summary (Agentic AI)
  async getFarmSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.query.provider as string | undefined;
      const result = await aiService.generateFarmSummary(provider);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getFarmSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const snapshot = await aiService.getFarmSnapshot();
      sendSuccess(res, snapshot);
    } catch (err) { next(err); }
  }

  // Conversations
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await aiService.getConversations(req.user!.userId);
      sendSuccess(res, conversations);
    } catch (err) { next(err); }
  }

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const conv = await aiService.getConversation(Number(req.params.id), req.user!.userId);
      sendSuccess(res, conv);
    } catch (err) { next(err); }
  }

  async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const conv = await aiService.createConversation(req.user!.userId, req.body);
      sendCreated(res, conv, 'Conversation created');
    } catch (err) { next(err); }
  }

  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await aiService.chat(
        Number(req.params.id),
        req.user!.userId,
        req.body.message,
      );
      sendSuccess(res, response);
    } catch (err) { next(err); }
  }

  async deleteConversation(req: Request, res: Response, next: NextFunction) {
    try {
      await aiService.deleteConversation(Number(req.params.id), req.user!.userId);
      sendSuccess(res, null, 'Conversation deleted');
    } catch (err) { next(err); }
  }

  // Alerts
  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        pondId: req.query.pondId ? Number(req.query.pondId) : undefined,
        isRead: req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined,
        isResolved: req.query.isResolved !== undefined ? req.query.isResolved === 'true' : undefined,
      };
      const alerts = await aiService.getAlerts(filters);
      sendSuccess(res, alerts);
    } catch (err) { next(err); }
  }

  async markAlertRead(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await aiService.markAlertRead(Number(req.params.id));
      sendSuccess(res, alert);
    } catch (err) { next(err); }
  }

  async resolveAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await aiService.resolveAlert(Number(req.params.id), req.user!.userId);
      sendSuccess(res, alert, 'Alert resolved');
    } catch (err) { next(err); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await aiService.getUnreadCount();
      sendSuccess(res, { count });
    } catch (err) { next(err); }
  }
}
