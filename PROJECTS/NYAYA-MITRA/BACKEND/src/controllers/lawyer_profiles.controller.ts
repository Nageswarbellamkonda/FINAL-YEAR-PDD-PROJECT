import { Request, Response } from 'express';
import { LawyerProfilesService } from '../services/lawyer_profiles.service';

export const getAllLawyerProfiles = async (req: Request, res: Response) => {
    try {
        const data = await LawyerProfilesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createLawyerProfiles = async (req: Request, res: Response) => {
    try {
        const data = await LawyerProfilesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
