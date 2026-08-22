import { supabase } from '../config/supabaseClient';

export class CitizenProfilesService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('citizen_profiles').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('citizen_profiles').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
