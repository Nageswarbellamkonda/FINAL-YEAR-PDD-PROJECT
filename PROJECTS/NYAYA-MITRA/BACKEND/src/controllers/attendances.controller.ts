import { Request, Response } from 'express';
import { AttendancesService } from '../services/attendances.service';

export const getAllAttendances = async (req: Request, res: Response) => {
    try {
        const data = await AttendancesService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createAttendances = async (req: Request, res: Response) => {
    try {
        const data = await AttendancesService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
