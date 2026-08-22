import { Router } from 'express';
import { getAllDutyAssignments, createDutyAssignments, updateDutyAssignments, deleteDutyAssignments } from '../controllers/duty_assignments.controller';

const router = Router();

router.get('/', getAllDutyAssignments);
router.post('/', createDutyAssignments);
router.put('/:id', updateDutyAssignments);
router.delete('/:id', deleteDutyAssignments);

export default router;
