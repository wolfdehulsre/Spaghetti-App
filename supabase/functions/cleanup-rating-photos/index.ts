// Scheduled with a dedicated secret header. JWT verification remains enabled.
import { createClient } from 'npm:@supabase/supabase-js@2.110.7';
import { createCleanupHandler } from './handler.mjs';
Deno.serve(createCleanupHandler({
  getSecret:()=>Deno.env.get('PHOTO_CLEANUP_SECRET'),
  createClient:()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}})
}));
