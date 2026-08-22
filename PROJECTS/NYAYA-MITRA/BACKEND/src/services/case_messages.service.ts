import { supabase } from '../config/supabaseClient';

export class CaseMessagesService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('case_messages').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('case_messages').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
