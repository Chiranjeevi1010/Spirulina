import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();
const controller = new InventoryController();

router.use(authenticate);

router.get('/', authorize('inventory', 'read'), controller.list);
router.get('/:id', authorize('inventory', 'read'), controller.getById);
router.post('/', authorize('inventory', 'write'), controller.create);
router.patch('/:id', authorize('inventory', 'write'), controller.updateQuantity);
router.put('/:id', authorize('inventory', 'write'), controller.updateItem);
router.delete('/:id', authorize('inventory', 'delete'), controller.deleteItem);

export default router;
