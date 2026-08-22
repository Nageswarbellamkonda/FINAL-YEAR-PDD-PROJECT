import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export const getActiveEmergencies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('emergencies')
            .select('*')
            .eq('status', 'active');
            
        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const reportEmergency = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, location, user_id, details } = req.body;
        const { data, error } = await supabase
            .from('emergencies')
            .insert([{ type, location, user_id, details, status: 'active', reported_at: new Date().toISOString() }]);
            
        if (error) throw error;
        res.status(201).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const updateEmergencyStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { data, error } = await supabase
            .from('emergencies')
            .update({ status })
            .eq('id', id);
            
        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};
