export interface Complaint {
    id: string;
    tracking_id: string;
    complainant_name: string;
    phone: string;
    incident_location: string;
    description: string;
    status: 'pending' | 'under_review' | 'converted_to_fir' | 'closed';
    assigned_officer_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ComplaintCreateDTO {
    complainant_name: string;
    phone: string;
    incident_location: string;
    description: string;
}
