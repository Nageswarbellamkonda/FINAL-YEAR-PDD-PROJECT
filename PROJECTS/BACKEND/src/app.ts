import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import complaintRoutes from './routes/complaint.routes';
import courtRoutes from './routes/court.routes';
import dashboardRoutes from './routes/dashboard.routes';
import dutyRoutes from './routes/duty.routes';
import emergencyRoutes from './routes/emergency.routes';
import firRoutes from './routes/fir.routes';
import usersRoutes from './routes/users.routes';
import citizen_profilesRoutes from './routes/citizen_profiles.routes';
import police_profilesRoutes from './routes/police_profiles.routes';
import lawyer_profilesRoutes from './routes/lawyer_profiles.routes';
import court_profilesRoutes from './routes/court_profiles.routes';
import adminsRoutes from './routes/admins.routes';
import activity_logsRoutes from './routes/activity_logs.routes';
import evidence_filesRoutes from './routes/evidence_files.routes';
import complaintsRoutes from './routes/complaints.routes';
import citizen_chatsRoutes from './routes/citizen_chats.routes';
import feedbackRoutes from './routes/feedback.routes';
import public_noticesRoutes from './routes/public_notices.routes';
import station_alertsRoutes from './routes/station_alerts.routes';
import duty_assignmentsRoutes from './routes/duty_assignments.routes';
import attendancesRoutes from './routes/attendances.routes';
import user_profilesRoutes from './routes/user_profiles.routes';
import case_messagesRoutes from './routes/case_messages.routes';
import cyber_crime_reportsRoutes from './routes/cyber_crime_reports.routes';
import women_safety_sessionsRoutes from './routes/women_safety_sessions.routes';
import ai_case_summariesRoutes from './routes/ai_case_summaries.routes';
import vw_admin_dashboard_metricsRoutes from './routes/vw_admin_dashboard_metrics.routes';
import attendanceRoutes from './routes/attendance.routes';

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';








const app: Application = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/complaint', complaintRoutes);
app.use('/api/court', courtRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/duty', dutyRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/fir', firRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/citizen_profiles', citizen_profilesRoutes);
app.use('/api/police_profiles', police_profilesRoutes);
app.use('/api/lawyer_profiles', lawyer_profilesRoutes);
app.use('/api/court_profiles', court_profilesRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/activity_logs', activity_logsRoutes);
app.use('/api/evidence_files', evidence_filesRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/citizen_chats', citizen_chatsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/public_notices', public_noticesRoutes);
app.use('/api/station_alerts', station_alertsRoutes);
app.use('/api/duty_assignments', duty_assignmentsRoutes);
app.use('/api/attendances', attendancesRoutes);
app.use('/api/user_profiles', user_profilesRoutes);
app.use('/api/case_messages', case_messagesRoutes);
app.use('/api/cyber_crime_reports', cyber_crime_reportsRoutes);
app.use('/api/women_safety_sessions', women_safety_sessionsRoutes);
app.use('/api/ai_case_summaries', ai_case_summariesRoutes);
app.use('/api/vw_admin_dashboard_metrics', vw_admin_dashboard_metricsRoutes);
app.use('/api/attendance', attendanceRoutes);



// Routes











app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'success', message: 'API is healthy' });
});

export default app;
