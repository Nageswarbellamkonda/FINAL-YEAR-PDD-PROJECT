export interface FIR {
    id: string;
    fir_number: string;
    station_id: string;
    complainant_name: string;
    incident_date: string;
    description: string;
    sections_applied: string[];
    status: 'draft' | 'filed' | 'under_investigation' | 'closed';
    investigating_officer_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface FIRCreateDTO {
    station_id: string;
    complainant_name: string;
    incident_date: string;
    description: string;
    sections_applied: string[];
}
