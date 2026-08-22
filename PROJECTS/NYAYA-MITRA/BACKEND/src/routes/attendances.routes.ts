import { Router } from 'express';
import { getAllAttendances, createAttendances } from '../controllers/attendances.controller';

const router = Router();

router.get('/', getAllAttendances);
router.post('/', createAttendances);

export default router;
