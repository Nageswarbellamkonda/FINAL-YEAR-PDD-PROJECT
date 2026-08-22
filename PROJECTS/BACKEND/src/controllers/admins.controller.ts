import { Request, Response } from 'express';
import { AdminsService } from '../services/admins.service';

export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        const data = await AdminsService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createAdmins = async (req: Request, res: Response) => {
    try {
        const data = await AdminsService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
