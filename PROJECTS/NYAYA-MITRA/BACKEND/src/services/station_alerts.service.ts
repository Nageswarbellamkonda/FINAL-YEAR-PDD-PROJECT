import { supabase } from '../config/supabaseClient';

export class StationAlertsService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('station_alerts').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('station_alerts').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
