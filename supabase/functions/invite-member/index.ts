import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { createInviteHandler } from "./handler.mjs";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appOrigin = Deno.env.get("APP_ORIGIN")!;
const auth = { persistSession: false, autoRefreshToken: false };
Deno.serve(createInviteHandler({
  appOrigin,
  caller: authorization => createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth }),
  admin: () => createClient(supabaseUrl, serviceKey, { auth }),
}));
