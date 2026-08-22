import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export const getCrimeHeatmapData = async (req: Request, res: Response): Promise<void> => {
    try {
        const { district, time_range } = req.query;
        const data = await AnalyticsService.getCrimeHeatmapData(district as string, time_range as string);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const getSystemAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const analytics = await AnalyticsService.getSystemAnalytics();
        res.json(analytics);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};
