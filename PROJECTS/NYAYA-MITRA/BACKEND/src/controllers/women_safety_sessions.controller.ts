import { Request, Response } from 'express';
import { WomenSafetySessionsService } from '../services/women_safety_sessions.service';

export const getAllWomenSafetySessions = async (req: Request, res: Response) => {
    try {
        const data = await WomenSafetySessionsService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createWomenSafetySessions = async (req: Request, res: Response) => {
    try {
        const data = await WomenSafetySessionsService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
