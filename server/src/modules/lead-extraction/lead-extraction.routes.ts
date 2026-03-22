import { Router } from 'express';
import { LeadExtractionController } from './lead-extraction.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { reviewExtractedLeadSchema, bulkReviewSchema } from '@spirulina/shared';

const router = Router();
const controller = new LeadExtractionController();

router.use(authenticate);

router.get('/stats', authorize('leads', 'read'), controller.getStats);
router.get('/history', authorize('leads', 'read'), controller.getHistory);
router.get('/', authorize('leads', 'read'), controller.list);
router.get('/:id', authorize('leads', 'read'), controller.getById);
router.patch('/:id/review', authorize('leads', 'write'), validate(reviewExtractedLeadSchema), controller.review);
router.post('/bulk-review', authorize('leads', 'write'), validate(bulkReviewSchema), controller.bulkReview);
router.post('/trigger', authorize('leads', 'write'), controller.triggerExtraction);

export default router;
