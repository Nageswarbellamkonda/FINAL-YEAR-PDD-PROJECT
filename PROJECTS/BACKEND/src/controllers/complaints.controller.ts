import { Request, Response } from 'express';
import { ComplaintsService } from '../services/complaints.service';

export const getAllComplaints = async (req: Request, res: Response) => {
    try {
        const data = await ComplaintsService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createComplaints = async (req: Request, res: Response) => {
    try {
        const data = await ComplaintsService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const updateComplaints = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const data = await ComplaintsService.update(id, req.body);
        res.json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
