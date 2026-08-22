import { Router } from 'express';
import { getAllCitizenChats, createCitizenChats } from '../controllers/citizen_chats.controller';

const router = Router();

router.get('/', getAllCitizenChats);
router.post('/', createCitizenChats);

export default router;
