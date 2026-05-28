import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''; // Need service role to check system stuff

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking schema...");
  
  const tables = ['profiles', 'user_roles', 'appointments', 'chatbot_knowledge', 'pending_admin_emails'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`❌ Table "${table}" error:`, error.message);
    } else {
      console.log(`✅ Table "${table}" exists.`);
    }
  }
}

checkSchema();
