import { Router } from 'express';
import { EmailController } from './email.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { sendEmailSchema, bulkSendEmailSchema, createEmailTemplateSchema } from '@spirulina/shared';

const router = Router();
const controller = new EmailController();

router.use(authenticate);

// Config
router.get('/config', authorize('settings', 'read'), controller.getConfig);
router.put('/config', authorize('settings', 'write'), controller.updateConfig);
router.post('/test-connection', authorize('settings', 'write'), controller.testConnection);

// Stats
router.get('/stats', authorize('leads', 'read'), controller.getStats);

// Send
router.post('/send', authorize('leads', 'write'), validate(sendEmailSchema), controller.sendEmail);
router.post('/bulk-send', authorize('leads', 'write'), validate(bulkSendEmailSchema), controller.bulkSend);

// Log
router.get('/log', authorize('leads', 'read'), controller.getLog);

// Templates
router.get('/templates', authorize('leads', 'read'), controller.listTemplates);
router.get('/templates/:id', authorize('leads', 'read'), controller.getTemplate);
router.post('/templates', authorize('leads', 'write'), validate(createEmailTemplateSchema), controller.createTemplate);
router.put('/templates/:id', authorize('leads', 'write'), controller.updateTemplate);
router.delete('/templates/:id', authorize('leads', 'delete'), controller.deleteTemplate);

export default router;
