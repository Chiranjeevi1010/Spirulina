import { Router } from 'express';
import { MarketingController } from './marketing.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';

const router = Router();
const controller = new MarketingController();

router.use(authenticate);

// Demo Farms
router.get('/demo-farms', authorize('marketing', 'read'), controller.listDemoFarms);
router.get('/demo-farms/:id', authorize('marketing', 'read'), controller.getDemoFarm);
router.post('/demo-farms', authorize('marketing', 'write'), controller.createDemoFarm);
router.put('/demo-farms/:id', authorize('marketing', 'write'), controller.updateDemoFarm);
router.delete('/demo-farms/:id', authorize('marketing', 'delete'), controller.deleteDemoFarm);

// Testimonials
router.get('/testimonials', authorize('marketing', 'read'), controller.listTestimonials);
router.post('/testimonials', authorize('marketing', 'write'), controller.createTestimonial);
router.put('/testimonials/:id', authorize('marketing', 'write'), controller.updateTestimonial);
router.patch('/testimonials/:id/publish', authorize('marketing', 'write'), controller.publishTestimonial);
router.delete('/testimonials/:id', authorize('marketing', 'delete'), controller.deleteTestimonial);

export default router;
