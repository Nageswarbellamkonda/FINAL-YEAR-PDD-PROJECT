import { Router } from 'express';
import { getAllPublicNotices, createPublicNotices } from '../controllers/public_notices.controller';

const router = Router();

router.get('/', getAllPublicNotices);
router.post('/', createPublicNotices);

export default router;
