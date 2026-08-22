import { supabase } from '../config/supabaseClient';
import { FIR, FIRCreateDTO } from '../models/fir.model';
import { v4 as uuidv4 } from 'uuid';

export class FIRService {
    static async getAllFIRs(): Promise<FIR[]> {
        const { data, error } = await supabase
            .from('firs')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data as FIR[];
    }

    static async getFIRById(id: string): Promise<FIR> {
        const { data, error } = await supabase
            .from('firs')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        return data as FIR;
    }

    static async createFIR(firDto: FIRCreateDTO): Promise<FIR> {
        const firNumber = `FIR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
        
        const newFir = {
            id: uuidv4(),
            fir_number: firNumber,
            status: 'filed',
            ...firDto
        };

        const { data, error } = await supabase
            .from('firs')
            .insert([newFir])
            .select()
            .single();
            
        if (error) throw error;
        return data as FIR;
    }
}
