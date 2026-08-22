import { supabase } from '../config/supabaseClient';

export class ActivityLogsService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('activity_logs').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('activity_logs').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
