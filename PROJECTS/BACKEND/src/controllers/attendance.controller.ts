import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

export const getAllAttendance = async (req: Request, res: Response) => {
    try {
        const data = await AttendanceService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createAttendance = async (req: Request, res: Response) => {
    try {
        const data = await AttendanceService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
