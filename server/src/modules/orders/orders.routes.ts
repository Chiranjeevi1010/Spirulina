import { Router } from 'express';
import { OrdersController } from './orders.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createOrderSchema } from '@spirulina/shared';

const router = Router();
const controller = new OrdersController();

router.use(authenticate);

router.get('/summary', authorize('orders', 'read'), controller.getRevenueSummary);
router.get('/', authorize('orders', 'read'), controller.list);
router.get('/:id', authorize('orders', 'read'), controller.getById);
router.post('/', authorize('orders', 'write'), validate(createOrderSchema), controller.create);
router.put('/:id', authorize('orders', 'write'), controller.update);
router.delete('/:id', authorize('orders', 'delete'), controller.delete);
router.patch('/:id/status', authorize('orders', 'write'), controller.updateStatus);
router.patch('/:id/payment', authorize('orders', 'write'), controller.updatePayment);

export default router;
