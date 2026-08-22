export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    role: string;
    profile_completed: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface AuthSession {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: UserProfile;
}
