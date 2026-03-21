import { Router } from 'express';
import { PondsController } from './ponds.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createPondSchema, updatePondSchema } from '@spirulina/shared';

const router = Router();
const controller = new PondsController();

router.use(authenticate);

router.get('/overview', authorize('ponds', 'read'), controller.overview);
router.get('/', authorize('ponds', 'read'), controller.list);
router.get('/:id', authorize('ponds', 'read'), controller.getById);
router.post('/', authorize('ponds', 'write'), validate(createPondSchema), controller.create);
router.put('/:id', authorize('ponds', 'write'), validate(updatePondSchema), controller.update);
router.delete('/:id', authorize('ponds', 'delete'), controller.delete);
router.patch('/:id/status', authorize('ponds', 'write'), controller.updateStatus);

export default router;
