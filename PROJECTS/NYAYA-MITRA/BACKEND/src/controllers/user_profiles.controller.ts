import { Request, Response } from 'express';
import { UserProfilesService } from '../services/user_profiles.service';

export const getAllUserProfiles = async (req: Request, res: Response) => {
    try {
        const data = await UserProfilesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createUserProfiles = async (req: Request, res: Response) => {
    try {
        const data = await UserProfilesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const updateUserProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const data = await UserProfilesService.update(id, req.body);
        res.json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
