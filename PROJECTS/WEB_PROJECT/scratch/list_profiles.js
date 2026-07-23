import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbznxozzucrhpppicjpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem54b3p6dWNyaHBwcGljanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDg1MzAsImV4cCI6MjA5OTg4NDUzMH0.ypnRyHKiT9a1zR_ZTVqPU0izrpmMmN-L7iKe2gneEqQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listUsers() {
  const { data: users, error } = await supabase.from('user_profiles').select('*').limit(10);
  if (error) {
    console.error("Error reading profiles:", error);
  } else {
    console.log("Profiles list:", users.map(u => ({ email: u.email, role: u.role, full_name: u.full_name })));
  }
}

listUsers();
