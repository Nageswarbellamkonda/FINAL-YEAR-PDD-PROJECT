import { Request, Response } from 'express';
import { FIRService } from '../services/fir.service';

export const getFIRs = async (req: Request, res: Response): Promise<void> => {
    try {
        const firs = await FIRService.getAllFIRs();
        res.json(firs);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const getFIRById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const fir = await FIRService.getFIRById(id as string);
        res.json(fir);
    } catch (err: any) {
        res.status(404).json({ error: err.message || 'FIR not found' });
    }
};

export const createFIR = async (req: Request, res: Response): Promise<void> => {
    try {
        const newFir = await FIRService.createFIR(req.body);
        res.status(201).json(newFir);
    } catch (err: any) {
        res.status(400).json({ error: err.message || 'Bad Request' });
    }
};
