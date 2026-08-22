import { supabase } from '../config/supabaseClient';
import { Duty, Attendance, DutyCreateDTO } from '../models/duty.model';
import { v4 as uuidv4 } from 'uuid';

export class DutyService {
    static async getDutiesForOfficer(officerId: string): Promise<Duty[]> {
        const { data, error } = await supabase
            .from('duties')
            .select('*')
            .eq('officer_id', officerId)
            .order('start_time', { ascending: true });
            
        if (error) throw error;
        return data as Duty[];
    }

    static async assignDuty(dutyDto: DutyCreateDTO): Promise<Duty> {
        const newDuty = {
            id: uuidv4(),
            status: 'assigned',
            ...dutyDto
        };

        const { data, error } = await supabase
            .from('duties')
            .insert([newDuty])
            .select()
            .single();
            
        if (error) throw error;
        return data as Duty;
    }

    static async markAttendance(officerId: string, locationLat: number, locationLng: number): Promise<Attendance> {
        const newAttendance = {
            id: uuidv4(),
            officer_id: officerId,
            check_in_time: new Date().toISOString(),
            location_lat: locationLat,
            location_lng: locationLng,
            status: 'present'
        };

        const { data, error } = await supabase
            .from('attendance')
            .insert([newAttendance])
            .select()
            .single();
            
        if (error) throw error;
        return data as Attendance;
    }
}
