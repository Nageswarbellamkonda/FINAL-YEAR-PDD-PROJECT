import { Router } from 'express';
import { getAllFeedback, createFeedback } from '../controllers/feedback.controller';

const router = Router();

router.get('/', getAllFeedback);
router.post('/', createFeedback);

export default router;
