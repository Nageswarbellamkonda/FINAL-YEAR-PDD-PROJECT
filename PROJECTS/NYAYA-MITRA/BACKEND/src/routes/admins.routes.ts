import { Router } from 'express';
import { getAllAdmins, createAdmins } from '../controllers/admins.controller';

const router = Router();

router.get('/', getAllAdmins);
router.post('/', createAdmins);

export default router;
