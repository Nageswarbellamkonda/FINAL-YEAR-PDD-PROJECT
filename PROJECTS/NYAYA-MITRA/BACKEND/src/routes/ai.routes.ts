import { Router } from 'express';
import { askNyayaAI, getPoliceAdvisory, analyzePatterns } from '../controllers/ai.controller';

const router = Router();

router.post('/ask', askNyayaAI);
router.post('/advisory', getPoliceAdvisory);
router.post('/analyze-patterns', analyzePatterns);

export default router;
