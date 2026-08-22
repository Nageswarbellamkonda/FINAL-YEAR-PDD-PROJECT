import { Router } from 'express';
import { getActiveEmergencies, reportEmergency, updateEmergencyStatus } from '../controllers/emergency.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/active', getActiveEmergencies);
router.post('/report', reportEmergency);
router.put('/:id/status', updateEmergencyStatus);

export default router;
