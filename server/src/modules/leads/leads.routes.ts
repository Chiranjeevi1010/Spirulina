import { Router } from 'express';
import { LeadsController } from './leads.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createLeadSchema } from '@spirulina/shared';

const router = Router();
const controller = new LeadsController();

router.use(authenticate);

router.get('/pipeline', authorize('leads', 'read'), controller.getPipeline);
router.get('/', authorize('leads', 'read'), controller.list);
router.get('/:id', authorize('leads', 'read'), controller.getById);
router.post('/', authorize('leads', 'write'), validate(createLeadSchema), controller.create);
router.put('/:id', authorize('leads', 'write'), controller.update);
router.delete('/:id', authorize('leads', 'delete'), controller.delete);
router.patch('/:id/status', authorize('leads', 'write'), controller.updateStatus);
router.post('/:id/convert', authorize('leads', 'write'), controller.convertToCustomer);

export default router;
