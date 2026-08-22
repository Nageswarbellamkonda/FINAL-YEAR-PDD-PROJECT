import { Router } from 'express';
import { getAllCyberCrimeReports, createCyberCrimeReports } from '../controllers/cyber_crime_reports.controller';

const router = Router();

router.get('/', getAllCyberCrimeReports);
router.post('/', createCyberCrimeReports);

export default router;
