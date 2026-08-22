import { supabase } from '../config/supabaseClient';

export class PublicNoticesService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('public_notices').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('public_notices').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
