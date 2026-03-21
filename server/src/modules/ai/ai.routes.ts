import { Router } from 'express';
import { AIController } from './ai.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new AIController();

router.use(authenticate);

// Agentic Farm Summary
router.get('/farm-summary', controller.getFarmSummary);
router.get('/farm-snapshot', controller.getFarmSnapshot);

// Conversations
router.get('/conversations', controller.getConversations);
router.get('/conversations/:id', controller.getConversation);
router.post('/conversations', controller.createConversation);
router.post('/conversations/:id/chat', controller.chat);
router.delete('/conversations/:id', controller.deleteConversation);

// Alerts
router.get('/alerts', controller.getAlerts);
router.get('/alerts/unread-count', controller.getUnreadCount);
router.patch('/alerts/:id/read', controller.markAlertRead);
router.patch('/alerts/:id/resolve', controller.resolveAlert);

export default router;
