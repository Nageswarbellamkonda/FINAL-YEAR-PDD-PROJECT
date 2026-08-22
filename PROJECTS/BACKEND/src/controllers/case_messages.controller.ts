import { Request, Response } from 'express';
import { CaseMessagesService } from '../services/case_messages.service';

export const getAllCaseMessages = async (req: Request, res: Response) => {
    try {
        const data = await CaseMessagesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createCaseMessages = async (req: Request, res: Response) => {
    try {
        const data = await CaseMessagesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
