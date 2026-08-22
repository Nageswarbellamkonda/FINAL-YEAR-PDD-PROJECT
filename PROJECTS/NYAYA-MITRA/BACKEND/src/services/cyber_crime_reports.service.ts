import { supabase } from '../config/supabaseClient';

export class CyberCrimeReportsService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('cyber_crime_reports').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('cyber_crime_reports').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
