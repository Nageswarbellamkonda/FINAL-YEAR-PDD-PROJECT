import { Request, Response } from 'express';
import { ComplaintService } from '../services/complaint.service';

export const getComplaints = async (req: Request, res: Response): Promise<void> => {
    try {
        const complaints = await ComplaintService.getAllComplaints();
        res.json(complaints);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const getComplaintById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const complaint = await ComplaintService.getComplaintById(id as string);
        res.json(complaint);
    } catch (err: any) {
        res.status(404).json({ error: err.message || 'Complaint not found' });
    }
};

export const createComplaint = async (req: Request, res: Response): Promise<void> => {
    try {
        const newComplaint = await ComplaintService.createComplaint(req.body);
        res.status(201).json(newComplaint);
    } catch (err: any) {
        res.status(400).json({ error: err.message || 'Bad Request' });
    }
};
