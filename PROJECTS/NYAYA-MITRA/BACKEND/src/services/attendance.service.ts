import { supabase } from '../config/supabaseClient';

export class AttendanceService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('attendance').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('attendance').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
