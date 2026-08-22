import { Request, Response } from 'express';
import { ActivityLogsService } from '../services/activity_logs.service';

export const getAllActivityLogs = async (req: Request, res: Response) => {
    try {
        const data = await ActivityLogsService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createActivityLogs = async (req: Request, res: Response) => {
    try {
        const data = await ActivityLogsService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
