import { Request, Response } from 'express';
import { VwAdminDashboardMetricsService } from '../services/vw_admin_dashboard_metrics.service';

export const getAllVwAdminDashboardMetrics = async (req: Request, res: Response) => {
    try {
        const data = await VwAdminDashboardMetricsService.getAll();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createVwAdminDashboardMetrics = async (req: Request, res: Response) => {
    try {
        const data = await VwAdminDashboardMetricsService.create(req.body);
        res.status(201).json(data);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
