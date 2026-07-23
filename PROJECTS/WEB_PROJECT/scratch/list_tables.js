import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbznxozzucrhpppicjpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem54b3p6dWNyaHBwcGljanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDg1MzAsImV4cCI6MjA5OTg4NDUzMH0.ypnRyHKiT9a1zR_ZTVqPU0izrpmMmN-L7iKe2gneEqQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
  const tables = [
    'user_profiles', 'citizen_profiles', 'police_profiles', 'lawyer_profiles',
    'court_profiles', 'admins', 'complaints', 'fir_documents', 'evidence',
    'trusted_contacts', 'notifications', 'activity_logs'
  ];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t}: Error ${error.code} - ${error.message}`);
    } else {
      console.log(`Table ${t}: EXISTS (Success)`);
    }
  }
}

listTables();
