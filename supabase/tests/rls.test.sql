begin;
create extension if not exists pgtap with schema extensions;
select plan(40);
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
('10000000-0000-4000-8000-000000000001','authenticated','authenticated','owner@test.invalid','',now(),'{}','{}'),
('10000000-0000-4000-8000-000000000002','authenticated','authenticated','member@test.invalid','',now(),'{}','{}'),
('10000000-0000-4000-8000-000000000003','authenticated','authenticated','outsider@test.invalid','',now(),'{}','{}');
insert into public.groups(id,name) values('20000000-0000-4000-8000-000000000001','Test spaghetti group');
insert into public.group_members(group_id,user_id,role,display_name) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','owner','Owner'),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','member','Member');
insert into public.restaurants(id,group_id,name,address,created_by) values('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Test Trattoria','Ghent','10000000-0000-4000-8000-000000000001');
insert into public.ratings(id,group_id,restaurant_id,created_by,visited_on,sauce,texture,portion) values('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',current_date,4,5,3);insert into public.ratings(id,group_id,restaurant_id,created_by,visited_on,sauce,texture,portion) values('40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',current_date,3,4,3);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select is((select count(*)::int from public.ratings),2,'a group member sees shared ratings');
select results_eq($$update public.ratings set sauce=1 where id='40000000-0000-4000-8000-000000000001' returning id$$,$$select id::uuid from public.ratings where false$$,'a member cannot edit another member rating');
select results_eq($$delete from public.ratings where id='40000000-0000-4000-8000-000000000001' returning id$$,$$select id::uuid from public.ratings where false$$,'a member cannot delete another member rating');
select results_eq($$insert into public.ratings(id,group_id,restaurant_id,created_by,visited_on,sauce,texture,portion) values('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',current_date,3,3,3) returning id$$,$$select '40000000-0000-4000-8000-000000000002'::uuid$$,'a member can add their own rating');
select results_eq($$update public.ratings set sauce=5 where id='40000000-0000-4000-8000-000000000002' returning sauce$$,$$select 5::smallint$$,'a member can edit their own rating');
select results_eq($$delete from public.ratings where id='40000000-0000-4000-8000-000000000002' returning id$$,$$select '40000000-0000-4000-8000-000000000002'::uuid$$,'a member can delete their own rating');
select results_eq($$insert into public.restaurants(id,group_id,name,address,created_by) values('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Member Trattoria','Brussels','10000000-0000-4000-8000-000000000002') returning id$$,$$select '30000000-0000-4000-8000-000000000002'::uuid$$,'a member can add a restaurant to their group');
select results_eq($$update public.restaurants set address='Antwerp' where id='30000000-0000-4000-8000-000000000002' returning address$$,$$select 'Antwerp'::text$$,'a member can edit shared restaurant details');
select results_eq($$delete from public.restaurants where id='30000000-0000-4000-8000-000000000002' returning id$$,$$select id::uuid from public.restaurants where false$$,'a member cannot delete a restaurant');
select results_eq($$update public.group_members set display_name='New name' where group_id='20000000-0000-4000-8000-000000000001' and user_id='10000000-0000-4000-8000-000000000002' returning display_name$$,$$select 'New name'::text$$,'a member can change their own display name');
select results_eq($$update public.group_members set display_name='Impersonated' where user_id='10000000-0000-4000-8000-000000000001' returning display_name$$,$$select display_name from public.group_members where false$$,'a member cannot change another member display name');
select throws_ok($$update public.group_members set display_name='   ' where user_id='10000000-0000-4000-8000-000000000002'$$,'23514',null,'blank display names are rejected');
select is(has_column_privilege('authenticated','public.group_members','active','UPDATE'),false,'members cannot grant their own group access');
select throws_ok($$update public.group_members set active=false where user_id='10000000-0000-4000-8000-000000000002'$$,'42501',null,'a member cannot change activation status directly');
set local role service_role;
update public.group_members set active=false where user_id='10000000-0000-4000-8000-000000000002';
set local role authenticated;
select is((select count(*)::int from public.groups),0,'a deactivated member loses group visibility with the existing JWT');
select is((select count(*)::int from public.ratings),0,'a deactivated member loses ratings visibility');
select is((select count(*)::int from public.restaurants),0,'a deactivated member loses restaurant visibility');
select is((select count(*)::int from public.group_members),0,'a deactivated member loses member directory visibility');
select results_eq($$update public.group_members set display_name='Inactive' where user_id='10000000-0000-4000-8000-000000000002' returning display_name$$,$$select display_name from public.group_members where false$$,'a deactivated member cannot change their name');
select throws_ok($$insert into public.ratings(group_id,restaurant_id,created_by,visited_on,sauce,texture,portion) values('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',current_date,3,3,3)$$,'42501',null,'a deactivated member cannot add ratings');
select lives_ok($$delete from public.ratings$$,'deactivated-member delete requests are harmless');
set local role service_role;
select is((select count(*)::int from public.ratings where created_by='10000000-0000-4000-8000-000000000002'),1,'deactivation preserves existing ratings');
select throws_ok($$update public.group_members set active=false where user_id='10000000-0000-4000-8000-000000000001'$$,'23514',null,'an owner must remain active');
update public.group_members set active=true where user_id='10000000-0000-4000-8000-000000000002';
set local role authenticated;
select is((select count(*)::int from public.ratings),2,'reactivation restores group access');
select throws_ok($$update public.group_members set role='owner' where user_id='10000000-0000-4000-8000-000000000002'$$,'42501',null,'a member cannot change roles');
select throws_ok($$insert into public.ratings(group_id,restaurant_id,created_by,visited_on,sauce,texture,portion) values('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',current_date,1,1,1)$$,'42501',null,'a member cannot submit a rating for another user');
select is(has_function_privilege('authenticated','public.guard_rating_update()','EXECUTE'),false,'authenticated users cannot directly invoke rating update guard functions');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select is((select count(*)::int from public.groups),0,'a non-member cannot see the group');
select is((select count(*)::int from public.restaurants),0,'a non-member cannot see restaurants');
select is((select count(*)::int from public.ratings),0,'a non-member cannot see ratings');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select results_eq($$delete from public.ratings where id='40000000-0000-4000-8000-000000000003' returning id$$,$$select '40000000-0000-4000-8000-000000000003'::uuid$$,'a group owner can delete another member rating');
select results_eq($$delete from public.restaurants where id='30000000-0000-4000-8000-000000000002' returning id$$,$$select '30000000-0000-4000-8000-000000000002'::uuid$$,'a group owner can delete a restaurant');
select is(has_function_privilege('authenticated','public.consume_invite_rate_limit(uuid)','EXECUTE'),false,'authenticated users cannot invoke invite rate limits directly');
select is(has_function_privilege('service_role','public.consume_invite_rate_limit(uuid)','EXECUTE'),true,'service role can invoke invite rate limits');
set local role service_role;
select is(public.consume_invite_rate_limit('10000000-0000-4000-8000-000000000001'),true,'first invitation is allowed');
select is(public.consume_invite_rate_limit('10000000-0000-4000-8000-000000000001'),true,'second invitation is allowed');
select is(public.consume_invite_rate_limit('10000000-0000-4000-8000-000000000001'),true,'third invitation is allowed');
select is(public.consume_invite_rate_limit('10000000-0000-4000-8000-000000000001'),true,'fourth invitation is allowed');
select is(public.consume_invite_rate_limit('10000000-0000-4000-8000-000000000001'),true,'fifth invitation is allowed');
select is(public.consume_invite_rate_limit('10000000-0000-4000-8000-000000000001'),false,'sixth invitation in an hour is denied');select * from finish();
rollback;

