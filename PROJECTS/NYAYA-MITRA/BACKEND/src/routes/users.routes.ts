import { Router } from 'express';
import { getUsers, updateUser } from '../controllers/users.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, getUsers);
router.put('/:id', requireAuth, updateUser);

export default router;
