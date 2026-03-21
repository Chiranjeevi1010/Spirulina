import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();
const controller = new ReportsController();

router.use(authenticate);

router.get('/production', authorize('reports', 'read'), controller.getProductionReport);
router.get('/sales', authorize('reports', 'read'), controller.getSalesReport);
router.get('/expenses', authorize('reports', 'read'), controller.getExpenseReport);

export default router;
