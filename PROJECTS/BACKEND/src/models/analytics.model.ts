export interface CrimeHeatmapData {
    location: string;
    count: number;
    severity: 'High' | 'Medium' | 'Low';
    latitude?: number;
    longitude?: number;
}

export interface SystemAnalytics {
    total_complaints: number;
    total_firs: number;
    total_users: number;
    resolution_rate: string;
}
