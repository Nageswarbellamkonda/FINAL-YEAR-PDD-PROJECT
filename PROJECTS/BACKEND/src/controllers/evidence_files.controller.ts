import { Request, Response } from 'express';
import { EvidenceFilesService } from '../services/evidence_files.service';

export const getAllEvidenceFiles = async (req: Request, res: Response) => {
    try {
        const data = await EvidenceFilesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createEvidenceFiles = async (req: Request, res: Response) => {
    try {
        const data = await EvidenceFilesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
