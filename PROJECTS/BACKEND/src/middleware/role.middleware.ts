import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { supabase } from '../config/supabaseClient';

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Fetch user profile to get the role
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        res.status(403).json({ error: 'Forbidden: Role not found' });
        return;
      }

      if (!allowedRoles.includes(profile.role)) {
        res.status(403).json({ error: `Forbidden: Requires one of roles: ${allowedRoles.join(', ')}` });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};
