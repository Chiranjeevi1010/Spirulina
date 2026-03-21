import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();
const controller = new SettingsController();

router.use(authenticate);

router.get('/', authorize('settings', 'read'), controller.getAll);
router.get('/:category', authorize('settings', 'read'), controller.getByCategory);
router.get('/:category/:key', authorize('settings', 'read'), controller.get);
router.put('/', authorize('settings', 'write'), controller.upsert);
router.delete('/:id', authorize('settings', 'delete'), controller.delete);

export default router;
