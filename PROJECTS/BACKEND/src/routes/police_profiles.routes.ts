import { Router } from 'express';
import { getAllPoliceProfiles, createPoliceProfiles } from '../controllers/police_profiles.controller';

const router = Router();

router.get('/', getAllPoliceProfiles);
router.post('/', createPoliceProfiles);

export default router;
