export interface Duty {
    id: string;
    officer_id: string;
    duty_type: string;
    location: string;
    start_time: string;
    end_time: string;
    status: 'assigned' | 'in_progress' | 'completed';
    created_at?: string;
    updated_at?: string;
}

export interface Attendance {
    id: string;
    officer_id: string;
    duty_id?: string;
    check_in_time: string;
    check_out_time?: string;
    location_lat: number;
    location_lng: number;
    status: 'present' | 'absent' | 'late';
    created_at?: string;
}

export interface DutyCreateDTO {
    officer_id: string;
    duty_type: string;
    location: string;
    start_time: string;
    end_time: string;
}
