import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Using Service Role Key on the backend for admin privileges over the DB
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
