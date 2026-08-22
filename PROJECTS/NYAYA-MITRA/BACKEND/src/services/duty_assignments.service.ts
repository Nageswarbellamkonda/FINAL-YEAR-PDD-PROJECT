import { supabase } from '../config/supabaseClient';

export class DutyAssignmentsService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('duty_assignments').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('duty_assignments').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
    static async update(id: string, payload: any): Promise<any> {
        const { data, error } = await supabase.from('duty_assignments').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
    static async delete(id: string): Promise<any> {
        const { data, error } = await supabase.from('duty_assignments').delete().eq('id', id).select().single();
        if (error) throw error;
        return data;
    }
}
