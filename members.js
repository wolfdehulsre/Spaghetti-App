(() => {
  const config = window.APP_CONFIG || {};
  const $ = selector => document.querySelector(selector);
  const text = (selector, message) => { $(selector).textContent = message; if (selector === '#members-access') $(selector).hidden = false; };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let db, busy = false;
  async function request(body) {
    const { data: { session } } = await db.auth.getSession();
    if (!session) { location.replace('/?next=members'); throw Error('Your session expired. Sign in again.'); }
    const response = await fetch(config.supabaseUrl + '/functions/v1/invite-member', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ ...body, group_id: config.groupId }) });
    let result;
    try { result = await response.json(); } catch { throw Error('Could not complete this request. Try again.'); }
    if (!response.ok) throw Error(result.error || 'Could not complete this request. Try again.');
    return result;
  }
  async function refresh() {
    text('#member-list-status', 'Loading members…');
    try {
      const result = await request({ action: 'list' });
      $('#members-list').innerHTML = result.members.map(member => '<article class="rating-card member-card"><div class="card-top"><div><div class="card-name" data-i18n-skip>' + esc(member.display_name) + '</div><div class="member-email" data-i18n-skip>' + esc(member.email) + '</div></div><span class="tag">' + (member.role === 'owner' ? 'Owner' : 'Member') + '</span></div><p class="member-state">' + (member.status === 'active' ? 'Account active' : 'Waiting for account activation') + '</p>' + (member.status === 'invited' && member.email ? '<button type="button" class="resend-invitation" data-email="' + esc(member.email) + '">Resend invitation</button>' : '') + '</article>').join('');
      text('#member-list-status', '');
    } catch (error) { text('#member-list-status', error.message); }
  }
  async function submit(body) {
    if (busy) return;
    busy = true;
    document.querySelectorAll('#member-form button,.resend-invitation,#refresh-members').forEach(button => { button.disabled = true; });
    text('#member-status', body.action === 'resend' ? 'Sending invitation…' : 'Adding member…');
    try {
      const result = await request(body);
      const messages = { invited: 'Invitation sent. They can choose a password using the email link.', already_member: 'This person is already a member. Their access is ready.', added_existing: 'Existing account added. They can sign in with their own password.' };
      text('#member-status', result.status === 'added_existing' && result.pending ? 'Group access is ready. Use Resend invitation to send a fresh activation email.' : messages[result.status] || 'Member added.');
      if (body.action !== 'resend') $('#member-form').reset();
      await refresh();
    } catch (error) { text('#member-status', error.message); }
    finally { busy = false; document.querySelectorAll('#member-form button,.resend-invitation,#refresh-members').forEach(button => { button.disabled = false; }); }
  }
  async function boot() {
    if (!config.supabaseUrl || !config.supabaseAnonKey || !config.groupId || !window.supabase) { text('#members-access', 'The app could not connect. Reload and try again.'); return; }
    db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data: { session } } = await db.auth.getSession();
    if (!session) { location.replace('/?next=members'); return; }
    db.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') location.replace('/'); });
    $('#sign-out').onclick = async () => { const result = await db.auth.signOut(); if (result.error) text('#members-access', 'Sign out failed. Try again.'); };
    document.addEventListener('click', event => { if (!$('#account-controls').contains(event.target)) $('#account-controls').open = false; });
    const { data: member, error } = await db.from('group_members').select('role,display_name').eq('group_id', config.groupId).eq('user_id', session.user.id).maybeSingle();
    if (error) { text('#members-access', 'Could not verify group permissions.'); return; }
    $('#account-name').textContent = member?.display_name || 'Account';
    if(member)window.ProfileMenu?.mount({db,groupId:config.groupId,userId:session.user.id,name:member.display_name,onSaved:refresh});
    $('#account-controls').hidden = false;
    if (member?.role !== 'owner') { text('#members-access', 'Only a group owner can invite members.'); return; }
    $('#members-access').hidden = true;
    $('#members-content').hidden = false;
    $('#member-form').onsubmit = event => { event.preventDefault(); const values = new FormData(event.currentTarget); submit({ action: 'invite', email: String(values.get('email')).trim(), display_name: String(values.get('display_name')).trim() }); };
    $('#members-list').onclick = event => { const button = event.target.closest('[data-email]'); if (button) submit({ action: 'resend', email: button.dataset.email }); };
    $('#refresh-members').onclick = () => { if (!busy) refresh(); };
    await refresh();
  }
  document.addEventListener('DOMContentLoaded', () => { boot().catch(() => text('#members-access', 'The app could not connect. Reload and try again.')); });
})();
