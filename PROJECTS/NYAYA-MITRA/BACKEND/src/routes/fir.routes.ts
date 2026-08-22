import { Router } from 'express';
import { createFIR, getFIRs } from '../controllers/fir.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Only police officers can register FIRs
router.post('/', requireAuth, requireRole(['si', 'inspector', 'dsp', 'sp', 'ssp']), createFIR);

// Citizens can only view their own FIRs, but this generic route gets all for police for now.
// For production, we'd add filters based on role inside the controller.
router.get('/', requireAuth, getFIRs);

export default router;
