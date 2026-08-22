import { Router } from 'express';
import { getOfficerDashboardData } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/officer', requireAuth, getOfficerDashboardData);

export default router;
