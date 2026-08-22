import { Request, Response } from 'express';
import { CitizenProfilesService } from '../services/citizen_profiles.service';

export const getAllCitizenProfiles = async (req: Request, res: Response) => {
    try {
        const data = await CitizenProfilesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createCitizenProfiles = async (req: Request, res: Response) => {
    try {
        const data = await CitizenProfilesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
