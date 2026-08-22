import { supabase } from '../config/supabaseClient';

export class FeedbackService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('feedback').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('feedback').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
