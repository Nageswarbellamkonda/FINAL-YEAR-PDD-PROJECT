import { Router } from 'express';
import { getAllVwAdminDashboardMetrics, createVwAdminDashboardMetrics } from '../controllers/vw_admin_dashboard_metrics.controller';

const router = Router();

router.get('/', getAllVwAdminDashboardMetrics);
router.post('/', createVwAdminDashboardMetrics);

export default router;
