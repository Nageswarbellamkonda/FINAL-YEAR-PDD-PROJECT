import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/auth.middleware';

export const getOfficerDashboardData = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const rank = user?.role || 'police';
        const district = user?.district;
        const department = user?.department;

        let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });

        if (['dgp', 'ig', 'adg'].includes(rank)) {
            query = query.limit(200);
        } else if (['sp', 'dsp'].includes(rank)) {
            if (district) query = query.eq('district', district);
            query = query.limit(100);
        } else if (rank === 'ci') {
            if (department) query = query.eq('assigned_department', department);
            else if (district) query = query.eq('district', district);
            query = query.limit(50);
        } else {
            // Standard police officer
            query = query.or(`assigned_officer.eq.${user?.id},assigned_to.eq.${user?.id}`);
            query = query.limit(50);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
