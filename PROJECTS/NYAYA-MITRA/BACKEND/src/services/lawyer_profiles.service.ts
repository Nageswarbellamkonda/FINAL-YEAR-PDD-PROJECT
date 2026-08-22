import { supabase } from '../config/supabaseClient';

export class LawyerProfilesService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('lawyer_profiles').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('lawyer_profiles').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
