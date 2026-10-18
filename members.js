(() => {
  const config = window.APP_CONFIG || {};
  const $ = selector => document.querySelector(selector);
  const text = (selector, message) => { $(selector).textContent = message; if (selector === '#members-access') $(selector).hidden = false; };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let db, busy = false, pendingAccess = null;
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
      $('#members-list').innerHTML = result.members.map(member => '<article class="rating-card member-card"><div class="card-top"><div><div class="card-name" data-i18n-skip>' + esc(member.display_name) + '</div><div class="member-email" data-i18n-skip>' + esc(member.email) + '</div></div><span class="tag">' + (member.role === 'owner' ? 'Owner' : 'Member') + '</span></div><p class="member-state">' + (member.status === 'inactive' ? 'Deactivated' : member.status === 'active' ? 'Account active' : 'Waiting for account activation') + '</p><div class="member-actions">' + (member.status === 'invited' && member.email ? '<button type="button" class="resend-invitation" data-email="' + esc(member.email) + '">Resend invitation</button>' : '') + (member.role !== 'owner' && member.user_id ? '<button type="button" class="member-access-button" data-member-id="' + esc(member.user_id) + '" data-member-name="' + esc(member.display_name) + '" data-member-action="' + (member.status === 'inactive' ? 'reactivate' : 'deactivate') + '">' + (member.status === 'inactive' ? 'Reactivate' : 'Deactivate') + '</button>' : '') + '</div></article>').join('');
      text('#member-list-status', '');
    } catch (error) { text('#member-list-status', error.message); }
  }
  async function submit(body) {
    if (busy) return;
    busy = true;
    document.querySelectorAll('#member-form button,.resend-invitation,.member-access-button,#refresh-members').forEach(button => { button.disabled = true; });
    text('#member-status', body.action === 'deactivate' ? 'Deactivating member…' : body.action === 'reactivate' ? 'Reactivating member…' : body.action === 'resend' ? 'Sending invitation…' : 'Adding member…');
    try {
      const result = await request(body);
      const messages = { deactivated: 'Member deactivated. Their ratings are preserved.', reactivated: 'Member reactivated. Their group access is restored.', inactive_member: 'This member is deactivated. Use Reactivate to restore access.', invited: 'Invitation sent. They can choose a password using the email link.', already_member: 'This person is already a member. Their access is ready.', added_existing: 'Existing account added. They can sign in with their own password.' };
      text('#member-status', result.status === 'added_existing' && result.pending ? 'Group access is ready. Use Resend invitation to send a fresh activation email.' : messages[result.status] || 'Member added.');
      if (body.action === 'invite') $('#member-form').reset();
      await refresh();
    } catch (error) { text('#member-status', error.message); }
    finally { busy = false; document.querySelectorAll('#member-form button,.resend-invitation,.member-access-button,#refresh-members').forEach(button => { button.disabled = false; }); }
  }
  async function boot() {
    if (!config.supabaseUrl || !config.supabaseAnonKey || !config.groupId || !window.supabase) { text('#members-access', 'The app could not connect. Reload and try again.'); return; }
    db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data: { session } } = await db.auth.getSession();
    if (!session) { location.replace('/?next=members'); return; }
    db.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') location.replace('/'); });
    $('#sign-out').onclick = async () => { const result = await db.auth.signOut(); if (result.error) text('#members-access', 'Sign out failed. Try again.'); };
    document.addEventListener('click', event => { if (!$('#account-controls').contains(event.target)) $('#account-controls').open = false; });
    const { data: member, error } = await db.from('group_members').select('role,display_name,active').eq('group_id', config.groupId).eq('user_id', session.user.id).maybeSingle();
    if (error) { text('#members-access', 'Could not verify group permissions.'); return; }
    $('#account-name').textContent = member?.display_name || 'Account';
    if(member)window.ProfileMenu?.mount({db,groupId:config.groupId,userId:session.user.id,name:member.display_name,onSaved:refresh});
    $('#account-controls').hidden = false;
    if (member?.role !== 'owner' || member?.active === false) { text('#members-access', 'Only a group owner can invite members.'); return; }
    $('#members-access').hidden = true;
    $('#members-content').hidden = false;
    $('#member-form').onsubmit = event => { event.preventDefault(); const values = new FormData(event.currentTarget); submit({ action: 'invite', email: String(values.get('email')).trim(), display_name: String(values.get('display_name')).trim() }); };
    $('#members-list').onclick = event => {
      if(busy)return;
      const access=event.target.closest('[data-member-action]');
      if(access){
        const question=access.dataset.memberAction==='deactivate' ? 'Deactivate this member? They will lose group access. Their ratings will be preserved.' : 'Reactivate this member and restore their group access?';
        pendingAccess={action:access.dataset.memberAction,user_id:access.dataset.memberId};
        $('#member-access-question').textContent=question;$('#member-access-name').textContent=access.dataset.memberName;
        $('#member-access-confirm').textContent=access.dataset.memberAction==='deactivate'?'Deactivate':'Reactivate';
        $('#member-access-dialog').showModal();
        return;
      }
      const button=event.target.closest('[data-email]');if(button)submit({action:'resend',email:button.dataset.email});
    };
    $('#member-access-confirm').onclick=()=>{const action=pendingAccess;pendingAccess=null;$('#member-access-dialog').close();if(action)submit(action);};
    $('#member-access-cancel').onclick=()=>{pendingAccess=null;$('#member-access-dialog').close();};
    $('#member-access-dialog').addEventListener('cancel',()=>{pendingAccess=null;});
    $('#refresh-members').onclick = () => { if (!busy) refresh(); };
    await refresh();
  }
  document.addEventListener('DOMContentLoaded', () => { boot().catch(() => text('#members-access', 'The app could not connect. Reload and try again.')); });
})();
