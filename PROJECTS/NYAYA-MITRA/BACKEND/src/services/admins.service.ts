import { supabase } from '../config/supabaseClient';

export class AdminsService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('admins').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('admins').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
