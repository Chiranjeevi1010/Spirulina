import { Router } from 'express';
import { ProductionController } from './production.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createProductionSchema } from '@spirulina/shared';

const router = Router();
const controller = new ProductionController();

router.use(authenticate);

router.get('/stats', authorize('harvest', 'read'), controller.getStats);
router.get('/', authorize('harvest', 'read'), controller.list);
router.get('/:id', authorize('harvest', 'read'), controller.getById);
router.post('/', authorize('harvest', 'write'), validate(createProductionSchema), controller.create);
router.put('/:id', authorize('harvest', 'write'), controller.update);
router.delete('/:id', authorize('harvest', 'delete'), controller.delete);

export default router;
