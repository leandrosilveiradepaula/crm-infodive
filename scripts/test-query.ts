import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function run() {
  const { data: { user } } = await sb.auth.signInWithPassword({ email: 'atendimento@crmnext.com.br', password: 'password123' }); // Try with user or just secret bypass if we knew it, let's use service_role
}
run();
