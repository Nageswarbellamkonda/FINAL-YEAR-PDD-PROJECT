import { Router } from 'express';
import { getAllLawyerProfiles, createLawyerProfiles } from '../controllers/lawyer_profiles.controller';

const router = Router();

router.get('/', getAllLawyerProfiles);
router.post('/', createLawyerProfiles);

export default router;
