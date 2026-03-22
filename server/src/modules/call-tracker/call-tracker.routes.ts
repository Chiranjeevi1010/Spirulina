import { Router } from 'express';
import { CallTrackerController } from './call-tracker.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createCallLogSchema } from '@spirulina/shared';

const router = Router();
const controller = new CallTrackerController();

router.use(authenticate);

router.get('/stats', authorize('leads', 'read'), controller.getStats);
router.get('/daily-target', authorize('leads', 'read'), controller.getDailyTarget);
router.get('/follow-ups', authorize('leads', 'read'), controller.getFollowUps);
router.get('/analytics', authorize('leads', 'read'), controller.getAnalytics);
router.get('/', authorize('leads', 'read'), controller.list);
router.get('/:id', authorize('leads', 'read'), controller.getById);
router.post('/', authorize('leads', 'write'), validate(createCallLogSchema), controller.create);
router.put('/:id', authorize('leads', 'write'), controller.update);
router.delete('/:id', authorize('leads', 'delete'), controller.delete);
router.patch('/:id/complete-follow-up', authorize('leads', 'write'), controller.completeFollowUp);

export default router;
