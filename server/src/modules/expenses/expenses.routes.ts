import { Router } from 'express';
import { ExpensesController } from './expenses.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();
const controller = new ExpensesController();

router.use(authenticate);

router.get('/categories', authorize('expenses', 'read'), controller.getCategories);
router.post('/categories', authorize('expenses', 'write'), controller.createCategory);
router.get('/summary', authorize('expenses', 'read'), controller.getSummary);
router.get('/', authorize('expenses', 'read'), controller.list);
router.get('/:id', authorize('expenses', 'read'), controller.getById);
router.post('/', authorize('expenses', 'write'), controller.create);
router.put('/:id', authorize('expenses', 'write'), controller.update);
router.delete('/:id', authorize('expenses', 'delete'), controller.delete);
router.patch('/:id/approve', authorize('expenses', 'write'), controller.approve);
router.patch('/:id/reject', authorize('expenses', 'write'), controller.reject);

export default router;
