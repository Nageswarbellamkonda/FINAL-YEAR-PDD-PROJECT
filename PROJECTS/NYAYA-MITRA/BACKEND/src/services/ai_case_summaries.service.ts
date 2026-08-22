import { supabase } from '../config/supabaseClient';

export class AiCaseSummariesService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('ai_case_summaries').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('ai_case_summaries').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
