import { supabase } from '../config/supabaseClient';

export class ComplaintsService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('complaints').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('complaints').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
    static async update(id: string, payload: any): Promise<any> {
        const { data, error } = await supabase.from('complaints').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
}
