import { Router } from 'express';
import { getCrimeHeatmapData, getSystemAnalytics } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/heatmap', getCrimeHeatmapData);
router.get('/system', getSystemAnalytics);

export default router;
