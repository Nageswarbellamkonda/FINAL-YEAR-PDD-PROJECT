import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbznxozzucrhpppicjpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem54b3p6dWNyaHBwcGljanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDg1MzAsImV4cCI6MjA5OTg4NDUzMH0.ypnRyHKiT9a1zR_ZTVqPU0izrpmMmN-L7iKe2gneEqQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  const { data: d1, error: e1 } = await supabase
    .from('complaints')
    .select('case_id, category, created_by')
    .limit(1);
  console.log("Querying [002_full_schema] columns (case_id, category, created_by):", {
    success: !e1,
    error: e1 ? { code: e1.code, message: e1.message } : null
  });

  const { data: d2, error: e2 } = await supabase
    .from('complaints')
    .select('complaint_number, complaint_type, user_id')
    .limit(1);
  console.log("Querying [002_complete_schema] columns (complaint_number, complaint_type, user_id):", {
    success: !e2,
    error: e2 ? { code: e2.code, message: e2.message } : null
  });
}

inspectSchema();
