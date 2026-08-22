import { supabase } from '../config/supabaseClient';
import { CrimeHeatmapData, SystemAnalytics } from '../models/analytics.model';

export class AnalyticsService {
    static async getCrimeHeatmapData(district?: string, timeRange?: string): Promise<CrimeHeatmapData[]> {
        // Mock data aggregation logic mapped to domain models for the structural audit.
        return [
            { location: 'Zone A', count: 120, severity: 'High' },
            { location: 'Zone B', count: 45, severity: 'Medium' },
            { location: 'Zone C', count: 10, severity: 'Low' }
        ];
    }

    static async getSystemAnalytics(): Promise<SystemAnalytics> {
        const { count: complaintsCount, error: cErr } = await supabase.from('complaints').select('*', { count: 'exact', head: true });
        const { count: firsCount, error: fErr } = await supabase.from('firs').select('*', { count: 'exact', head: true });
        const { count: usersCount, error: uErr } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
        
        if (cErr || fErr || uErr) {
            throw new Error('Database query failed during analytics aggregation');
        }

        return {
            total_complaints: complaintsCount || 0,
            total_firs: firsCount || 0,
            total_users: usersCount || 0,
            resolution_rate: '78%' // Stub for KPI
        };
    }
}
