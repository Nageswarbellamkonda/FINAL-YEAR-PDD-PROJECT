import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbznxozzucrhpppicjpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem54b3p6dWNyaHBwcGljanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDg1MzAsImV4cCI6MjA5OTg4NDUzMH0.ypnRyHKiT9a1zR_ZTVqPU0izrpmMmN-L7iKe2gneEqQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCounts() {
  const tables = [
    'user_profiles', 'citizen_profiles', 'police_profiles', 'admins', 
    'complaints', 'fir_documents', 'cyber_crime_reports', 'missing_persons',
    'command_center_events', 'patrol_logs', 'activity_logs', 'evidence'
  ];

  console.log('--- TABLE ROW COUNTS ---');
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(table.padEnd(25), 'ERROR:', error.message);
    } else {
      console.log(table.padEnd(25), count);
    }
  }
}
checkCounts();
