begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,aud,role,email) values
('11000000-0000-4000-8000-000000000001','authenticated','authenticated','photo-owner@test.invalid'),
('11000000-0000-4000-8000-000000000002','authenticated','authenticated','photo-member@test.invalid'),
('11000000-0000-4000-8000-000000000003','authenticated','authenticated','photo-outsider@test.invalid');
insert into public.groups(id,name) values('22000000-0000-4000-8000-000000000001','Photo group');
insert into public.group_members(group_id,user_id,role,display_name) values
('22000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','owner','Owner'),
('22000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000002','member','Member');
insert into public.restaurants(id,group_id,name,created_by) values
('33000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','Test photo restaurant','11000000-0000-4000-8000-000000000001');
insert into public.ratings(id,group_id,restaurant_id,created_by,visited_on,sauce,texture,portion) values
('44000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000002',current_date,3,4,5);
create temporary table paths(label text primary key,path text);
grant all on paths to authenticated;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
insert into paths values('first',public.change_rating_photo('44000000-0000-4000-8000-000000000001','reserve'));
select ok((select path like '44000000-0000-4000-8000-000000000001/%.jpg' from paths where label='first'),'creator can reserve one immutable upload');
select throws_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','reserve')$$,'P0001',null,'parallel reservation is rejected');
select throws_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','finish',(select path from paths where label='first'))$$,'P0001',null,'missing upload cannot become current');
select throws_ok($$update public.rating_photos set path='spoof'$$,'42501',null,'client cannot bypass photo RPC');
select throws_ok($$insert into storage.objects(bucket_id,name) values('rating-photos','arbitrary.jpg')$$,'42501',null,'arbitrary upload is rejected by Storage RLS');
select lives_ok($$insert into storage.objects(bucket_id,name) select 'rating-photos',path from paths where label='first'$$,'reserved Storage path can be uploaded');
select is((select count(*)::int from storage.objects where bucket_id='rating-photos'),0,'pending upload is not readable');
select lives_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','finish',(select path from paths where label='first'))$$,'uploaded photo can be finalized');
select lives_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','finish',(select path from paths where label='first'))$$,'finish is idempotent after a lost response');
select is((select count(*)::int from storage.objects where bucket_id='rating-photos'),1,'current photo is readable');
insert into paths values('replacement',public.change_rating_photo('44000000-0000-4000-8000-000000000001','reserve'));
select is((select path from public.rating_photos),(select path from paths where label='first'),'reserving a replacement preserves the original');
select lives_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','cancel',(select path from paths where label='replacement'))$$,'failed replacement can be cancelled');
select is((select path from public.rating_photos),(select path from paths where label='first'),'failed replacement keeps the original');
select throws_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','remove','stale-path')$$,'P0001',null,'stale removal cannot delete a newer photo');
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is((select count(*)::int from storage.objects where bucket_id='rating-photos'),1,'another active member can read the photo');
select throws_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','reserve')$$,'42501',null,'group owner cannot replace another creator photo');
select throws_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','remove',(select path from paths where label='first'))$$,'42501',null,'group owner cannot remove photo independently of rating');
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*)::int from storage.objects where bucket_id='rating-photos'),0,'outsider cannot read photos');
select is((select count(*)::int from public.rating_photos),0,'outsider cannot read photo metadata');
select throws_ok($$select public.photo_cleanup_batch()$$,'42501',null,'cleanup is not a client API');
select throws_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','reserve')$$,'42501',null,'outsider cannot reserve uploads');
reset role;
update public.group_members set active=false where user_id='11000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select count(*)::int from storage.objects where bucket_id='rating-photos'),0,'deactivated creator cannot read photos');
select throws_ok($$select public.change_rating_photo('44000000-0000-4000-8000-000000000001','reserve')$$,'42501',null,'deactivated creator cannot upload');
reset role;
update public.group_members set active=true where user_id='11000000-0000-4000-8000-000000000002';
select ok(exists(select 1 from private.photo_cleanup where path=(select path from paths where label='replacement')),'cancelled upload is queued for cleanup');
set local role authenticated;
insert into paths values('expired',public.change_rating_photo('44000000-0000-4000-8000-000000000001','reserve'));
reset role;
update public.rating_photos set reserved_at=now()-interval '2 hours';
set local role service_role;
select lives_ok($$select public.photo_cleanup_batch()$$,'scheduled cleanup expires abandoned reservations');
reset role;
select is((select pending_path from public.rating_photos),null,'expired upload no longer accepts late writes');
select is((select path from public.rating_photos),(select path from paths where label='first'),'expiry preserves current photo');
delete from public.ratings where id='44000000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.rating_photos),0,'deleting rating removes its photo relationship');
select ok(exists(select 1 from private.photo_cleanup where path=(select path from paths where label='first')),'rating deletion durably queues file deletion');
select is((select public from storage.buckets where id='rating-photos'),false,'bucket is private');
select is((select file_size_limit from storage.buckets where id='rating-photos'),300000::bigint,'bucket enforces stored byte limit');
select * from finish();
rollback;
