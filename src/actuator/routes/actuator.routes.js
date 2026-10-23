import { Router } from 'express';
import actuatorController from '../controllers/actuator.controller.js';

const router = Router();

// Actuator Endpoints
router.get('/', actuatorController.getIndex);
router.get('/health', actuatorController.getHealth);
router.get('/info', actuatorController.getInfo);
router.get('/metrics', actuatorController.getMetrics);

export default router;
