import { Router } from 'express';
import { getAllComplaints, createComplaints, updateComplaints } from '../controllers/complaints.controller';

const router = Router();

router.get('/', getAllComplaints);
router.post('/', createComplaints);
router.put('/:id', updateComplaints);

export default router;
