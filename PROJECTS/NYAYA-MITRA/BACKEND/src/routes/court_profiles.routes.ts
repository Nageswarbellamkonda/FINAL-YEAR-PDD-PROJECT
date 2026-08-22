import { Router } from 'express';
import { getAllCourtProfiles, createCourtProfiles } from '../controllers/court_profiles.controller';

const router = Router();

router.get('/', getAllCourtProfiles);
router.post('/', createCourtProfiles);

export default router;
