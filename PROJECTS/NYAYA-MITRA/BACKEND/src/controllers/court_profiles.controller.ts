import { Request, Response } from 'express';
import { CourtProfilesService } from '../services/court_profiles.service';

export const getAllCourtProfiles = async (req: Request, res: Response) => {
    try {
        const data = await CourtProfilesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createCourtProfiles = async (req: Request, res: Response) => {
    try {
        const data = await CourtProfilesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
