import { supabase } from '../config/supabaseClient';

export class WomenSafetySessionsService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('women_safety_sessions').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('women_safety_sessions').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
