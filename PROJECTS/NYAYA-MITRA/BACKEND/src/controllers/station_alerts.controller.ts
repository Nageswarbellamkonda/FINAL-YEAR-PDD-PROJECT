import { Request, Response } from 'express';
import { StationAlertsService } from '../services/station_alerts.service';

export const getAllStationAlerts = async (req: Request, res: Response) => {
    try {
        const data = await StationAlertsService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createStationAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await StationAlertsService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        console.error("Error in createStationAlerts:", err);
        res.status(400).json({ error: err.message });
    }
};
