import { Router } from 'express';
import { getAllWomenSafetySessions, createWomenSafetySessions } from '../controllers/women_safety_sessions.controller';

const router = Router();

router.get('/', getAllWomenSafetySessions);
router.post('/', createWomenSafetySessions);

export default router;
