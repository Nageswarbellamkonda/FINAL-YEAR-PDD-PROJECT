import { supabase } from '../config/supabaseClient';
import { UserProfile } from '../models/auth.model';

export class AuthService {
    static async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    static async register(email: string, password: string, fullName: string, phone: string, role: string) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
            const profile: UserProfile = {
                id: data.user.id,
                email,
                full_name: fullName,
                phone,
                role: role || 'citizen',
                profile_completed: true
            };
            const { error: profileError } = await supabase.from('user_profiles').insert(profile);
            if (profileError) {
                console.error('Profile creation failed:', profileError);
                throw profileError;
            }
        }
        return data;
    }

    static async getProfile(userId: string): Promise<UserProfile> {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        return data;
    }
}
