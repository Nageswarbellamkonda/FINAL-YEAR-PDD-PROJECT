import { Router } from 'express';
import { getAllActivityLogs, createActivityLogs } from '../controllers/activity_logs.controller';

const router = Router();

router.get('/', getAllActivityLogs);
router.post('/', createActivityLogs);

export default router;
