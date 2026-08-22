import { Request, Response } from 'express';
import { PoliceProfilesService } from '../services/police_profiles.service';

export const getAllPoliceProfiles = async (req: Request, res: Response) => {
    try {
        const data = await PoliceProfilesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createPoliceProfiles = async (req: Request, res: Response) => {
    try {
        const data = await PoliceProfilesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
