import { Router } from 'express';
import { getAllStationAlerts, createStationAlerts } from '../controllers/station_alerts.controller';

const router = Router();

router.get('/', getAllStationAlerts);
router.post('/', createStationAlerts);

export default router;
