import test from 'node:test';
import assert from 'node:assert/strict';
import { createInviteHandler } from '../supabase/functions/invite-member/handler.mjs';

const group = '20000000-0000-4000-8000-000000000001';
const origin = 'https://spaghetti-app.pages.dev';
function fixture(options = {}) {
  const users = [...(options.users || [])];
  const ownerId=options.ownerId||'owner';
  const members = [{ group_id: group, user_id: ownerId, active: options.ownerActive !== false, role: options.role || 'owner', display_name: 'Owner' }, ...(options.members || [])];
  const calls = { emails: 0, authLookups: 0, upserts: [], updates: [] };
  let failInsert = options.failInsert;
  const admin = {
    auth: { admin: {
      async listUsers({ page }) { calls.authLookups++; return { data: { users: page === 1 ? [...users] : [] }, error: null }; },
      async inviteUserByEmail(email, params) {
        calls.emails++;
        assert.equal(params.redirectTo, origin + '/?auth=invite');
        if (options.emailFails) return { data: {}, error: new Error('mail failed') };
        let user = users.find(u => u.email === email);
        if (!user) { user = { id: 'new-user', email }; users.push(user); }
        return { data: { user }, error: null };
      },
    } },
    async rpc() { return { data: !options.rateLimited, error: null }; },
    from() {
      let filters = [], value, upsertOptions, patch;
      const q = {
        select() { return q; }, update(value) { patch=value; return q; }, eq(k, v) { filters.push([k, v]); return q; },
        maybeSingle() { const row=members.find(m=>filters.every(([k,v])=>m[k]===v))||null;if(patch){calls.updates.push({patch,filters});if(options.updateFails)return Promise.resolve({data:null,error:{message:'failed'}});if(row)Object.assign(row,patch);}return Promise.resolve({data:row?{...row}:null,error:null}); },
        order() { return Promise.resolve({ data: members.filter(m => filters.every(([k, v]) => m[k] === v)), error: null }); },
        upsert(v, o) { value = v; upsertOptions = o; return q; },
        then(resolve, reject) {
          calls.upserts.push(upsertOptions);
          assert.equal(upsertOptions.onConflict, 'group_id,user_id');
          assert.equal(upsertOptions.ignoreDuplicates, true);
          if (failInsert) { failInsert = false; return Promise.resolve({ error: { code: 'fixture-failure' } }).then(resolve, reject); }
          if (!members.some(m => m.group_id === value.group_id && m.user_id === value.user_id)) members.push(value);
          return Promise.resolve({ error: null }).then(resolve, reject);
        },
      };
      return q;
    },
  };
  const handle = createInviteHandler({ appOrigin: origin, caller: () => ({ auth: { getUser: async () => ({ data: { user: options.expired ? null : { id: ownerId } }, error: null }) } }), admin: () => admin });
  const request = async (body = {}, headers = {}) => {
    const response = await handle(new Request(origin, { method: 'POST', headers: { Origin: origin, Authorization: 'Bearer fixture', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ group_id: group, email: 'friend@example.invalid', ...body }) }));
    return { status: response.status, body: response.headers.get('content-type')?.includes('json') ? await response.json() : await response.text() };
  };
  return { request, users, members, calls };
}

test('new invitation creates Auth account and member once, repeats succeed without another email', async () => {
  const f = fixture();
  assert.equal((await f.request({ display_name: 'Friend' })).body.status, 'invited');
  assert.equal((await f.request()).body.status, 'already_member');
  assert.equal(f.calls.emails, 1);
  assert.equal(f.members.filter(m => m.user_id === 'new-user').length, 1);
  assert.equal(f.members.find(m => m.user_id === 'new-user').display_name, 'Friend');
});
test('existing confirmed account receives group access without password reset or email', async () => {
  const f = fixture({ users: [{ id: 'friend', email: 'friend@example.invalid', email_confirmed_at: '2026-10-01' }] });
  assert.equal((await f.request()).body.status, 'added_existing');
  assert.equal(f.calls.emails, 0);
  assert.equal(f.members.find(m => m.user_id === 'friend').role, 'member');
});
test('existing pending account can be repaired and explicitly re-invited', async () => {
  const f = fixture({ users: [{ id: 'friend', email: 'friend@example.invalid' }] });
  assert.equal((await f.request()).body.pending, true);
  assert.equal((await f.request({ action: 'resend' })).body.status, 'invited');
  assert.equal(f.calls.emails, 1);
  assert.equal(f.members.filter(m => m.user_id === 'friend').length, 1);
});
test('retry never downgrades an owner or overwrites their name', async () => {
  const f = fixture({ users: [{ id: 'owner', email: 'friend@example.invalid', email_confirmed_at: 'yes' }] });
  assert.equal((await f.request({ display_name: 'Changed' })).body.status, 'already_member');
  assert.equal(f.members[0].role, 'owner');
  assert.equal(f.members[0].display_name, 'Owner');
});
test('membership failure after sending email is recoverable on retry', async () => {
  const f = fixture({ failInsert: true });
  assert.equal((await f.request()).status, 500);
  assert.equal((await f.request()).body.status, 'added_existing');
  assert.equal(f.calls.emails, 1);
  assert.equal(f.members.filter(m => m.user_id === 'new-user').length, 1);
});
test('email failure during resend preserves existing membership and reports failure', async () => {
  const f = fixture({ emailFails: true, users: [{ id: 'friend', email: 'friend@example.invalid' }] });
  assert.equal((await f.request({ action: 'resend' })).status, 502);
  assert.ok(f.members.some(m => m.user_id === 'friend'));
});
test('ordinary member is denied before auth directory access or writes', async () => {
  const f = fixture({ role: 'member' });
  assert.equal((await f.request()).status, 403);
  assert.equal((await f.request({ action: 'list' })).status, 403);
  assert.equal(f.calls.authLookups, 0);
  assert.equal(f.calls.emails, 0);
});
test('ownership of a different group does not grant access', async () => {
  const f = fixture();
  assert.equal((await f.request({ group_id: '20000000-0000-4000-8000-000000000002' })).status, 403);
  assert.equal(f.calls.authLookups, 0);
});
test('expired/missing authentication is rejected', async () => {
  assert.equal((await fixture({ expired: true }).request()).status, 401);
  assert.equal((await fixture().request({}, { Authorization: '' })).status, 401);
});
test('CORS, unknown actions and invalid input are rejected', async () => {
  const f = fixture();
  assert.equal((await f.request({}, { Origin: 'https://untrusted.invalid' })).status, 403);
  assert.equal((await f.request({ action: 'delete' })).status, 400);
  assert.equal((await f.request({ email: 'invalid' })).status, 400);
  assert.equal((await f.request({ display_name: 'x'.repeat(81) })).status, 400);
});
test('rate limiting prevents account creation; listing does not consume invitations', async () => {
  const f = fixture({ rateLimited: true });
  assert.equal((await f.request()).status, 429);
  assert.equal(f.calls.emails, 0);
  assert.equal((await f.request({ action: 'list' })).status, 200);
});
test('member directory contains only members of the requested group', async () => {
  const f = fixture({ users: [{ id: 'friend', email: 'friend@example.invalid' }, { id: 'outsider', email: 'outsider@example.invalid' }], members: [{ user_id: 'friend', group_id: group, role: 'member', display_name: 'Friend' }, { user_id: 'outsider', group_id: 'elsewhere', role: 'owner', display_name: 'Outsider' }] });
  const result = await f.request({ action: 'list' });
  assert.equal(result.body.members.length, 2);
  assert.equal(result.body.members.find(m => m.email === 'friend@example.invalid').status, 'invited');
  assert.ok(!JSON.stringify(result.body).includes('outsider'));
});

const targetId='10000000-0000-4000-8000-000000000099';
test('owner can deactivate and reactivate a member without deleting their membership or sending mail',async()=>{
 const f=fixture({members:[{group_id:group,user_id:targetId,role:'member',display_name:'Friend',active:true}]});
 assert.equal((await f.request({action:'deactivate',user_id:targetId})).body.status,'deactivated');
 assert.equal(f.members.find(m=>m.user_id===targetId).active,false);
 assert.equal((await f.request({action:'reactivate',user_id:targetId})).body.status,'reactivated');
 assert.equal(f.members.find(m=>m.user_id===targetId).active,true);assert.equal(f.calls.emails,0);assert.equal(f.calls.authLookups,0);
 assert.deepEqual(f.calls.updates[0].filters,[['group_id',group],['user_id',targetId],['role','member']]);
});
test('ordinary and inactive owners cannot change membership status',async()=>{
 for(const options of [{role:'member'},{ownerActive:false}]){const f=fixture(options);assert.equal((await f.request({action:'deactivate',user_id:targetId})).status,403);assert.equal(f.calls.updates.length,0);}
});
test('self and owner deactivation are refused',async()=>{
 const f=fixture({ownerId:targetId});assert.equal((await f.request({action:'deactivate',user_id:targetId})).status,403);
 const other=fixture({members:[{group_id:group,user_id:targetId,role:'owner',active:true}]});assert.equal((await other.request({action:'deactivate',user_id:targetId})).status,403);assert.equal(other.calls.updates.length,0);
});
test('a target outside the requested group cannot be deactivated',async()=>{
 const f=fixture({members:[{group_id:'20000000-0000-4000-8000-000000000002',user_id:targetId,role:'member',active:true}]});assert.equal((await f.request({action:'deactivate',user_id:targetId})).status,404);assert.equal(f.calls.updates.length,0);
});
test('deactivation database failures report an error and retain active access',async()=>{
 const f=fixture({updateFails:true,members:[{group_id:group,user_id:targetId,role:'member',active:true}]});assert.equal((await f.request({action:'deactivate',user_id:targetId})).status,500);assert.equal(f.members.find(m=>m.user_id===targetId).active,true);
});
test('reinviting an inactive member never silently restores access or sends a mail',async()=>{
 const f=fixture({users:[{id:targetId,email:'friend@example.invalid'}],members:[{group_id:group,user_id:targetId,role:'member',active:false}]});assert.equal((await f.request()).body.status,'inactive_member');assert.equal(f.calls.emails,0);assert.equal(f.members.find(m=>m.user_id===targetId).active,false);
});
test('member directory reports inactive state and includes an action target ID',async()=>{
 const f=fixture({members:[{group_id:group,user_id:targetId,role:'member',active:false}]});const result=await f.request({action:'list'});const member=result.body.members.find(m=>m.user_id===targetId);assert.equal(member.status,'inactive');
});
test('membership status requests require a valid target UUID and authentication',async()=>{
 const f=fixture();assert.equal((await f.request({action:'deactivate',user_id:'invalid'})).status,400);const expired=fixture({expired:true});assert.equal((await expired.request({action:'deactivate',user_id:targetId})).status,401);
});
