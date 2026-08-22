import { Router } from 'express';
import { getCasesForCourt, updateCaseHearing } from '../controllers/court.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/cases', getCasesForCourt);
router.put('/cases/:case_id/hearing', updateCaseHearing);

export default router;
