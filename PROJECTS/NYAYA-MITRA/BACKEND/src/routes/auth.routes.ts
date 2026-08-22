import { Router } from 'express';
import { login, register, getProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', requireAuth, getProfile);

export default router;
