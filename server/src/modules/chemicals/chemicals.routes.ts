import { Router } from 'express';
import { ChemicalsController } from './chemicals.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createChemicalSchema, createChemicalUsageSchema } from '@spirulina/shared';

const router = Router();
const controller = new ChemicalsController();

router.use(authenticate);

router.get('/low-stock', authorize('chemicals', 'read'), controller.getLowStock);
router.get('/usage', authorize('chemicals', 'read'), controller.getUsageLog);
router.get('/', authorize('chemicals', 'read'), controller.list);
router.get('/:id', authorize('chemicals', 'read'), controller.getById);
router.post('/', authorize('chemicals', 'write'), validate(createChemicalSchema), controller.create);
router.put('/usage/:id', authorize('chemicals', 'write'), controller.updateUsage);
router.put('/:id', authorize('chemicals', 'write'), controller.update);
router.delete('/:id', authorize('chemicals', 'delete'), controller.delete);
router.post('/usage', authorize('chemicals', 'write'), validate(createChemicalUsageSchema), controller.logUsage);

export default router;
