import { Request, Response } from 'express';
import { DutyService } from '../services/duty.service';

export const assignDuty = async (req: Request, res: Response): Promise<void> => {
    try {
        const newDuty = await DutyService.assignDuty(req.body);
        res.status(201).json(newDuty);
    } catch (err: any) {
        res.status(400).json({ error: err.message || 'Bad Request' });
    }
};

export const getMyDuties = async (req: any, res: Response): Promise<void> => {
    try {
        const officerId = req.user?.id; // Assuming user ID is attached by auth middleware
        if (!officerId) throw new Error("Unauthorized");
        
        const duties = await DutyService.getDutiesForOfficer(officerId);
        res.json(duties);
    } catch (err: any) {
        res.status(401).json({ error: err.message || 'Unauthorized' });
    }
};

export const markAttendance = async (req: any, res: Response): Promise<void> => {
    try {
        const officerId = req.user?.id;
        if (!officerId) throw new Error("Unauthorized");
        
        const { location_lat, location_lng } = req.body;
        const attendance = await DutyService.markAttendance(officerId, location_lat, location_lng);
        res.status(201).json(attendance);
    } catch (err: any) {
        res.status(400).json({ error: err.message || 'Bad Request' });
    }
};
