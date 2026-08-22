import { Request, Response } from 'express';
import { FeedbackService } from '../services/feedback.service';

export const getAllFeedback = async (req: Request, res: Response) => {
    try {
        const data = await FeedbackService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createFeedback = async (req: Request, res: Response) => {
    try {
        const data = await FeedbackService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
