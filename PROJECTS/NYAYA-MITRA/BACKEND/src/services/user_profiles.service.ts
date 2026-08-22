import { supabase } from '../config/supabaseClient';

export class UserProfilesService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('user_profiles').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('user_profiles').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
    static async update(id: string, payload: any): Promise<any> {
        const { data, error } = await supabase.from('user_profiles').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
}
