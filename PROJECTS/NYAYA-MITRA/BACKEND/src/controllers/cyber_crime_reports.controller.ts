import { Request, Response } from 'express';
import { CyberCrimeReportsService } from '../services/cyber_crime_reports.service';

export const getAllCyberCrimeReports = async (req: Request, res: Response) => {
    try {
        const data = await CyberCrimeReportsService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createCyberCrimeReports = async (req: Request, res: Response) => {
    try {
        const data = await CyberCrimeReportsService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
