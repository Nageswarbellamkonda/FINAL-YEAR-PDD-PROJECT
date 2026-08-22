import { Request, Response } from 'express';
import { CitizenChatsService } from '../services/citizen_chats.service';

export const getAllCitizenChats = async (req: Request, res: Response) => {
    try {
        const data = await CitizenChatsService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createCitizenChats = async (req: Request, res: Response) => {
    try {
        const data = await CitizenChatsService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
