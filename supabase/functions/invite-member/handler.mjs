// @ts-check
/** @param {{appOrigin: string, caller: (authorization: string) => import('npm:@supabase/supabase-js@2.118.0').SupabaseClient, admin: () => import('npm:@supabase/supabase-js@2.118.0').SupabaseClient}} options */
export function createInviteHandler(options) {
  const cors = { "Access-Control-Allow-Origin": options.appOrigin, "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
  /** @param {number} status @param {unknown} body */
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  /** @param {Request} request */
  return async (request) => {
    if (request.headers.get("origin") !== options.appOrigin) return new Response("Origin not allowed", { status: 403 });
    if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (request.method !== "POST") return json(405, { error: "Method not allowed" });
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json(401, { error: "Sign in as a group owner first." });
    let body;
    try { body = await request.json(); } catch { return json(400, { error: "Invalid request." }); }
    const action = body?.action || "invite";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const groupId = typeof body?.group_id === "string" ? body.group_id : "";
    const name = typeof body?.display_name === "string" ? body.display_name.trim() : "";
    if (!["invite", "resend", "list"].includes(action) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId) || (action !== "list" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || name.length > 80))) return json(400, { error: "Enter a valid email address and group." });
    try {
      const { data: { user }, error: authError } = await options.caller(authorization).auth.getUser();
      if (authError || !user) return json(401, { error: "Your session expired. Sign in again." });
      const admin = options.admin();
      const permission = await admin.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
      if (permission.error) return json(500, { error: "Could not verify group permissions." });
      if (permission.data?.role !== "owner") return json(403, { error: "Only a group owner can invite members." });
      if (action !== "list") {
        const { data: allowed, error } = await admin.rpc("consume_invite_rate_limit", { target_user_id: user.id });
        if (error) return json(500, { error: "Could not check invitation limits. Try again later." });
        if (allowed !== true) return json(429, { error: "You have sent too many invitations. Try again in an hour." });
      }
      // Lookup stays server-side, after checking ownership of the requested group.
      /** @type {import('npm:@supabase/supabase-js@2.118.0').User[]} */
      const users = [];
      for (let page = 1; ; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) return json(500, { error: "Could not look up member accounts. Try again." });
        users.push(...data.users);
        if (data.users.length < 1000) break;
      }
      if (action === "list") {
        const { data, error } = await admin.from("group_members").select("user_id,display_name,role,created_at").eq("group_id", groupId).order("created_at");
        if (error) return json(500, { error: "Could not load members. Try again." });
        const byId = new Map(users.map(u => [u.id, u]));
        return json(200, { members: data.map(m => ({ display_name: m.display_name, role: m.role, email: byId.get(m.user_id)?.email || "", status: byId.get(m.user_id)?.email_confirmed_at ? "active" : "invited" })) });
      }
      let target = users.find(u => u.email?.toLowerCase() === email);
      let sent = false;
      if (!target) {
        const invitation = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: options.appOrigin + "/" });
        if (invitation.error || !invitation.data.user) return json(400, { error: "The invitation could not be sent. Check the email address and try again." });
        target = invitation.data.user;
        sent = true;
      }
      const existing = await admin.from("group_members").select("role").eq("group_id", groupId).eq("user_id", target.id).maybeSingle();
      if (existing.error) return json(500, { error: "Could not verify group membership. Try again." });
      // Conflict handling must not downgrade owners or overwrite existing member names.
      const { error } = await admin.from("group_members").upsert({ group_id: groupId, user_id: target.id, role: "member", display_name: name || email.split("@")[0].slice(0, 80) }, { onConflict: "group_id,user_id", ignoreDuplicates: true });
      if (error) {
        console.error("invite-member membership failed", { code: error.code });
        return json(500, { error: "The account exists, but group access could not be added. Retry to finish adding this member." });
      }
      if (action === "resend" && !target.email_confirmed_at && !sent) {
        const invitation = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: options.appOrigin + "/" });
        if (invitation.error) return json(502, { error: "Group access is ready, but the invitation email could not be sent. Try resending it." });
        sent = true;
      }
      return json(200, { status: sent ? "invited" : existing.data ? "already_member" : "added_existing", pending: !target.email_confirmed_at });
    } catch { return json(500, { error: "Could not complete this request. Try again." }); }
  };
}
