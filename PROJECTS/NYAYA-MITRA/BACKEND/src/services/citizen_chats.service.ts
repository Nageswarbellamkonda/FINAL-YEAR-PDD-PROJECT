import { supabase } from '../config/supabaseClient';

export class CitizenChatsService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('citizen_chats').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('citizen_chats').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
