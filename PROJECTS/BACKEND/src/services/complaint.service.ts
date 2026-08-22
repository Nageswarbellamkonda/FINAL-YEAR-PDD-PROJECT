import { supabase } from '../config/supabaseClient';
import { Complaint, ComplaintCreateDTO } from '../models/complaint.model';
import { v4 as uuidv4 } from 'uuid';

export class ComplaintService {
    static async getAllComplaints(): Promise<Complaint[]> {
        const { data, error } = await supabase
            .from('complaints')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data as Complaint[];
    }

    static async getComplaintById(id: string): Promise<Complaint> {
        const { data, error } = await supabase
            .from('complaints')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        return data as Complaint;
    }

    static async createComplaint(complaintDto: ComplaintCreateDTO, userId?: string): Promise<Complaint> {
        const trackingId = `CMP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
        
        const newComplaint = {
            id: uuidv4(),
            tracking_id: trackingId,
            status: 'pending',
            reporter_id: userId,
            ...complaintDto
        };

        const { data, error } = await supabase
            .from('complaints')
            .insert([newComplaint])
            .select()
            .single();
            
        if (error) throw error;
        return data as Complaint;
    }
}
