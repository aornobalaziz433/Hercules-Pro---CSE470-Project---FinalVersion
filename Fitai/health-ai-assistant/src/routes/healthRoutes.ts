import { Router } from 'express';
import HealthController from '../controllers/healthController';

const router = Router();
const healthController = new HealthController();

export function setHealthRoutes(app) {
    app.use('/api/health', router);
    router.get('/info', healthController.getHealthInfo.bind(healthController));
    router.post('/query', healthController.postHealthQuery.bind(healthController));
}