import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { createComplaint, getComplaints, getComplaintById } from '../controllers/complaint.controller';

const router = Router();

router.post('/', requireAuth, createComplaint);
router.get('/', requireAuth, getComplaints);
router.get('/:id', requireAuth, getComplaintById);

export default router;
