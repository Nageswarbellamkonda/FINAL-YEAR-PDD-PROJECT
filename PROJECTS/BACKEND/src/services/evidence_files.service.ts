import { supabase } from '../config/supabaseClient';

export class EvidenceFilesService {
    static async getAll(): Promise<any[]> {
        const { data, error } = await supabase.from('evidence_files').select('*');
        if (error) throw error;
        return data;
    }
    static async create(payload: any): Promise<any> {
        const { data, error } = await supabase.from('evidence_files').insert([payload]).select().single();
        if (error) throw error;
        return data;
    }
}
