import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const data = await AuthService.login(email, password);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Internal Server Error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name, phone, role } = req.body;
  try {
    const data = await AuthService.register(email, password, full_name, phone, role);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Internal Server Error' });
  }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const data = await AuthService.getProfile(req.user.id);
    res.json(data);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Profile not found' });
  }
};
