import { Router } from 'express';
import { getAllUserProfiles, createUserProfiles, updateUserProfiles } from '../controllers/user_profiles.controller';

const router = Router();

router.get('/', getAllUserProfiles);
router.post('/', createUserProfiles);
router.put('/:id', updateUserProfiles);

export default router;
