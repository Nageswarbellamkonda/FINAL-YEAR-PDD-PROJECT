import { Request, Response } from 'express';
import { DutyAssignmentsService } from '../services/duty_assignments.service';

export const getAllDutyAssignments = async (req: Request, res: Response) => {
    try {
        const data = await DutyAssignmentsService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createDutyAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await DutyAssignmentsService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        console.error("Error in createDutyAssignments:", err);
        res.status(400).json({ error: err.message });
    }
};

export const updateDutyAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const data = await DutyAssignmentsService.update(id, req.body);
        res.json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteDutyAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const data = await DutyAssignmentsService.delete(id);
        res.json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
