import { Router } from 'express';
import { getAllCaseMessages, createCaseMessages } from '../controllers/case_messages.controller';

const router = Router();

router.get('/', getAllCaseMessages);
router.post('/', createCaseMessages);

export default router;
