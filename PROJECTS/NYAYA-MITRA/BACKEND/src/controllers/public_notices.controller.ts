import { Request, Response } from 'express';
import { PublicNoticesService } from '../services/public_notices.service';

export const getAllPublicNotices = async (req: Request, res: Response) => {
    try {
        const data = await PublicNoticesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createPublicNotices = async (req: Request, res: Response) => {
    try {
        const data = await PublicNoticesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
