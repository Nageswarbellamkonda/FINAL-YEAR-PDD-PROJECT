import { Router } from 'express';
import { getAllCitizenProfiles, createCitizenProfiles } from '../controllers/citizen_profiles.controller';

const router = Router();

router.get('/', getAllCitizenProfiles);
router.post('/', createCitizenProfiles);

export default router;
