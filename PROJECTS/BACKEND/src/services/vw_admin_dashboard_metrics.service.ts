import { supabase } from '../config/supabaseClient';

export class VwAdminDashboardMetricsService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('vw_admin_dashboard_metrics').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('vw_admin_dashboard_metrics').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
