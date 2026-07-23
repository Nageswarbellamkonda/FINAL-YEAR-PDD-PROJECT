import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbznxozzucrhpppicjpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem54b3p6dWNyaHBwcGljanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDg1MzAsImV4cCI6MjA5OTg4NDUzMH0.ypnRyHKiT9a1zR_ZTVqPU0izrpmMmN-L7iKe2gneEqQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listFunctions() {
  // Query public functions
  const { data, error } = await supabase.rpc('get_my_functions_if_any'); // just checking if we can query functions or system catalogs
  console.log("RPC check error:", error);

  // Let's try querying information_schema.routines
  const { data: routines, error: err } = await supabase
    .from('pg_catalog.pg_proc')
    .select('proname')
    .limit(50);
  
  console.log("Routines:", routines, "Error:", err);
}

listFunctions();
