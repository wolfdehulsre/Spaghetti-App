import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appOrigin = Deno.env.get("APP_ORIGIN")!;
const cors = { "Access-Control-Allow-Origin": appOrigin, "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (request) => {
  if (request.headers.get("origin") !== appOrigin) return new Response("Origin not allowed", { status: 403 });
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json(401, { error: "Sign in as a group owner first." });
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const groupId = typeof body.group_id === "string" ? body.group_id : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[0-9a-f-]{36}$/i.test(groupId)) return json(400, { error: "Enter a valid email address and group." });
    const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await caller.auth.getUser();
    if (authError || !user) return json(401, { error: "Your session expired. Sign in again." });
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: membership, error: membershipError } = await admin.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
    if (membershipError) return json(500, { error: "Could not verify group permissions." });
    if (membership?.role !== "owner") return json(403, { error: "Only a group owner can invite members." });
    const { data: withinRateLimit, error: rateLimitError } = await admin.rpc("consume_invite_rate_limit", { target_user_id: user.id });
    if (rateLimitError) return json(500, { error: "Could not check invitation limits. Try again later." });
    if (withinRateLimit !== true) return json(429, { error: "You have sent too many invitations. Try again in an hour." });
    const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: appOrigin + "/" });
    if (inviteError || !invitation.user) return json(400, { error: "The invitation could not be sent. Check the email address and try again." });
    const displayName = email.split("@")[0].slice(0, 80) || "Spaghetti fan";
    const { error: insertError } = await admin.from("group_members").insert({ group_id: groupId, user_id: invitation.user.id, role: "member", display_name: displayName });
    if (insertError) return json(500, { error: "The email was invited, but group membership could not be created. Ask the owner to retry after checking the member list." });
    return json(200, { invited: true });
  } catch {
    return json(400, { error: "Invalid request." });
  }
});

