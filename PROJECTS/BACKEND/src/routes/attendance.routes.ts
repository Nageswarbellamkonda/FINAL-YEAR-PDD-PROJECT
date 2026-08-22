import { Router } from 'express';
import { getAllAttendance, createAttendance } from '../controllers/attendance.controller';

const router = Router();

router.get('/', getAllAttendance);
router.post('/', createAttendance);

export default router;
