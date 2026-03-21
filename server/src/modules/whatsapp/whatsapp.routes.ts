import { Router } from 'express';
import { WhatsAppController } from './whatsapp.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();
const controller = new WhatsAppController();

router.use(authenticate);

router.get('/config', authorize('settings', 'read'), controller.getConfig);
router.put('/config', authorize('settings', 'write'), controller.updateConfig);
router.get('/log', authorize('settings', 'read'), controller.getLog);
router.get('/log/order/:orderId', authorize('orders', 'read'), controller.getLogByOrder);
router.post('/test', authorize('settings', 'write'), controller.sendTestMessage);

export default router;
