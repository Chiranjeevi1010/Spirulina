import { Router } from 'express';
import { CrmDashboardController } from './crm-dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();
const controller = new CrmDashboardController();

router.use(authenticate);

router.get('/summary', authorize('leads', 'read'), controller.getSummary);

export default router;
