import { Router } from 'express';
import { BatchesController } from './batches.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();
const controller = new BatchesController();

router.use(authenticate);

router.get('/expiring', authorize('inventory', 'read'), controller.getExpiring);
router.get('/', authorize('inventory', 'read'), controller.list);
router.get('/:id', authorize('inventory', 'read'), controller.getById);
router.post('/', authorize('inventory', 'write'), controller.create);
router.put('/:id', authorize('inventory', 'write'), controller.update);
router.delete('/:id', authorize('inventory', 'delete'), controller.delete);
router.patch('/:id/status', authorize('inventory', 'write'), controller.updateStatus);
router.post('/:id/tests', authorize('inventory', 'write'), controller.addTest);
router.get('/:id/tests', authorize('inventory', 'read'), controller.getTests);

export default router;
