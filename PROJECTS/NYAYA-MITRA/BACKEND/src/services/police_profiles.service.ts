import { supabase } from '../config/supabaseClient';

export class PoliceProfilesService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('police_profiles').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('police_profiles').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
