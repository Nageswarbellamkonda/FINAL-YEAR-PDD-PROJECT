import { Router } from 'express';
import { getAllEvidenceFiles, createEvidenceFiles } from '../controllers/evidence_files.controller';

const router = Router();

router.get('/', getAllEvidenceFiles);
router.post('/', createEvidenceFiles);

export default router;
