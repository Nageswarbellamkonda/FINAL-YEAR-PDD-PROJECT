import { Request, Response } from 'express';
import { AiCaseSummariesService } from '../services/ai_case_summaries.service';

export const getAllAiCaseSummaries = async (req: Request, res: Response) => {
    try {
        const data = await AiCaseSummariesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createAiCaseSummaries = async (req: Request, res: Response) => {
    try {
        const data = await AiCaseSummariesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
