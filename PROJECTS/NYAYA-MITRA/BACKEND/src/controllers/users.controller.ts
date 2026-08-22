import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/auth.middleware';

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const role = user?.role || '';
        
        if (!['admin', 'dgp'].includes(role)) {
            return res.status(403).json({ error: 'Access denied. Admin/DGP only.' });
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const role = user?.role || '';
        
        if (!['admin', 'dgp'].includes(role)) {
            return res.status(403).json({ error: 'Access denied. Admin/DGP only.' });
        }

        const { id } = req.params;
        const updateData = req.body;

        const { error } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ success: true, message: 'User updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
