import { Router } from 'express';
import { assignDuty, getMyDuties, markAttendance } from '../controllers/duty.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// DSP/Admin assigning duties
router.post('/assign', requireAuth, requireRole(['dsp', 'sp', 'ssp', 'administrator']), assignDuty);

// SI/Constable viewing and marking their own duties
router.get('/my', requireAuth, requireRole(['si', 'asi', 'constable', 'head_constable', 'inspector']), getMyDuties);
router.post('/attendance', requireAuth, requireRole(['si', 'asi', 'constable', 'head_constable', 'inspector']), markAttendance);

export default router;
