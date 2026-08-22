import { supabase } from '../config/supabaseClient';

export class CourtProfilesService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('court_profiles').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('court_profiles').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
