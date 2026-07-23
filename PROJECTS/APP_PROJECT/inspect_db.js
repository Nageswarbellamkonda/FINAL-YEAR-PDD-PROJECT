import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbznxozzucrhpppicjpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem54b3p6dWNyaHBwcGljanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDg1MzAsImV4cCI6MjA5OTg4NDUzMH0.ypnRyHKiT9a1zR_ZTVqPU0izrpmMmN-L7iKe2gneEqQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTriggers() {
  console.log('Attempting to query pg_trigger...');
  const { data: d1, error: e1 } = await supabase.from('pg_trigger').select('*').limit(10);
  console.log('pg_trigger result:', { data: d1, error: e1 });

  console.log('Attempting to query pg_proc...');
  const { data: d2, error: e2 } = await supabase.from('pg_proc').select('*').limit(10);
  console.log('pg_proc result:', { data: d2, error: e2 });

  console.log('Attempting to query pg_class...');
  const { data: d3, error: e3 } = await supabase.from('pg_class').select('*').limit(10);
  console.log('pg_class result:', { data: d3, error: e3 });
}

inspectTriggers();
