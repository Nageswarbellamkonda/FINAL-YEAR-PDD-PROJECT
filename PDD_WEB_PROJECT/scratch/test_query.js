import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbznxozzucrhpppicjpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiem54b3p6dWNyaHBwcGljanBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMDg1MzAsImV4cCI6MjA5OTg4NDUzMH0.ypnRyHKiT9a1zR_ZTVqPU0izrpmMmN-L7iKe2gneEqQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  const email = `test_citizen_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const password = 'TestPassword123!';

  console.log(`Signing up test user: ${email}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test Citizen',
        role: 'citizen',
        district: 'Visakhapatnam',
        profile_completed: true
      }
    }
  });

  if (signUpError) {
    console.error("Sign up error:", signUpError);
    return;
  }

  console.log("Sign up success. User ID:", signUpData.user?.id);

  console.log("Querying complaints table as signed up user...");
  const { data: complaints, error: complaintsError } = await supabase
    .from('complaints')
    .select('*')
    .limit(5);

  if (complaintsError) {
    console.error("Querying complaints failed:", complaintsError);
  } else {
    console.log("Querying complaints succeeded! Count:", complaints.length);
  }
}

testQuery();
