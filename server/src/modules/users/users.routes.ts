import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '@spirulina/shared';

const router = Router();
const controller = new UsersController();

router.use(authenticate);

router.get('/', authorize('users', 'read'), controller.list);
router.get('/roles', authorize('users', 'read'), controller.listRoles);
router.get('/:id', authorize('users', 'read'), controller.getById);
router.post('/', authorize('users', 'write'), validate(createUserSchema), controller.create);
router.put('/:id', authorize('users', 'write'), validate(updateUserSchema), controller.update);
router.patch('/:id/status', authorize('users', 'write'), controller.updateStatus);

export default router;
