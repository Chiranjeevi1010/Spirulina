import { Router } from 'express';
import { HarvestController } from './harvest.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createHarvestSchema } from '@spirulina/shared';

const router = Router();
const controller = new HarvestController();

router.use(authenticate);

router.get('/stats', authorize('harvest', 'read'), controller.getStats);
router.get('/pond/:pondId', authorize('harvest', 'read'), controller.getByPond);
router.get('/', authorize('harvest', 'read'), controller.list);
router.get('/:id', authorize('harvest', 'read'), controller.getById);
router.post('/', authorize('harvest', 'write'), validate(createHarvestSchema), controller.create);
router.put('/:id', authorize('harvest', 'write'), controller.update);
router.delete('/:id', authorize('harvest', 'delete'), controller.delete);

export default router;
