import { Router } from 'express';
import { CustomersController } from './customers.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createCustomerSchema } from '@spirulina/shared';

const router = Router();
const controller = new CustomersController();

router.use(authenticate);

router.get('/', authorize('customers', 'read'), controller.list);
router.get('/:id', authorize('customers', 'read'), controller.getById);
router.post('/', authorize('customers', 'write'), validate(createCustomerSchema), controller.create);
router.put('/:id', authorize('customers', 'write'), controller.update);
router.delete('/:id', authorize('customers', 'delete'), controller.delete);
router.get('/:id/orders', authorize('customers', 'read'), controller.getOrderHistory);

export default router;
