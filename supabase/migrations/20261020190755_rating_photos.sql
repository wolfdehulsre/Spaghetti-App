-- One private, optimized photo per rating with durable cleanup.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('rating-photos','rating-photos',false,300000,array['image/webp','image/jpeg']);

create table public.rating_photos (
  rating_id uuid primary key references public.ratings(id) on delete cascade,
  path text unique,
  pending_path text unique,
  reserved_at timestamptz,
  check (path is null or path like rating_id::text || '/%'),
  check (pending_path is null or pending_path like rating_id::text || '/%')
);
create index rating_photos_pending_age_idx on public.rating_photos(reserved_at) where pending_path is not null;
alter table public.rating_photos enable row level security;
revoke all on public.rating_photos from public,anon,authenticated;
grant select on public.rating_photos to authenticated;
grant all on public.rating_photos to service_role;
create policy photos_read_group on public.rating_photos for select to authenticated
using (exists(select 1 from public.ratings r where r.id=rating_id));

create table private.photo_cleanup (
  path text primary key,
  not_before timestamptz not null default now() + interval '1 hour'
);
create index photo_cleanup_age_idx on private.photo_cleanup(not_before);
revoke all on private.photo_cleanup from public,anon,authenticated;

-- Private SECURITY DEFINER helpers are narrowly scoped. No direct client writes
-- to photo state: the RPCs below explicitly verify creator and active membership.
create function private.change_rating_photo(target uuid, action text, expected text default null)
returns text language plpgsql security definer set search_path='' as $$
declare r public.ratings; p public.rating_photos; result text;
begin
  select * into r from public.ratings where id=target for update;
  if r.id is null or auth.uid() is null or r.created_by<>auth.uid()
     or not private.is_group_member(r.group_id) then
    raise exception 'Not allowed' using errcode='42501';
  end if;
  insert into public.rating_photos(rating_id) values(target) on conflict do nothing;
  select * into p from public.rating_photos where rating_id=target for update;
  if action='reserve' then
    if p.pending_path is not null and p.reserved_at>now()-interval '15 minutes' then
      raise exception 'A photo upload is already in progress. Try again later.';
    end if;
    if p.pending_path is not null then
      insert into private.photo_cleanup(path) values(p.pending_path) on conflict do nothing;
    end if;
    result:=target::text || '/' || gen_random_uuid()::text || '.jpg';
    update public.rating_photos set pending_path=result,reserved_at=now() where rating_id=target;
  elsif action='finish' then
    if p.path=expected then return p.path; end if; -- retry after a lost response
    if p.pending_path is distinct from expected or p.reserved_at<=now()-interval '15 minutes'
       or not exists(select 1 from storage.objects where bucket_id='rating-photos' and name=expected) then
      raise exception 'Upload missing or expired. Try again.';
    end if;
    if p.path is not null then insert into private.photo_cleanup(path) values(p.path) on conflict do nothing; end if;
    update public.rating_photos set path=expected,pending_path=null,reserved_at=null where rating_id=target;
    result:=expected;
  elsif action='remove' then
    if p.path is null and p.pending_path is null then return null; end if;
    if p.path is distinct from expected then raise exception 'Photo changed. Reload before removing it.'; end if;
    if p.path is not null then insert into private.photo_cleanup(path) values(p.path) on conflict do nothing; end if;
    if p.pending_path is not null then insert into private.photo_cleanup(path) values(p.pending_path) on conflict do nothing; end if;
    update public.rating_photos set path=null,pending_path=null,reserved_at=null where rating_id=target;
  elsif action='cancel' then
    if p.pending_path=expected then
      insert into private.photo_cleanup(path) values(p.pending_path) on conflict do nothing;
      update public.rating_photos set pending_path=null,reserved_at=null where rating_id=target;
    end if;
  else raise exception 'Invalid photo action'; end if;
  return result;
end $$;
revoke all on function private.change_rating_photo(uuid,text,text) from public,anon;
grant execute on function private.change_rating_photo(uuid,text,text) to authenticated;
create function public.change_rating_photo(target uuid, action text, expected text default null)
returns text language sql security invoker set search_path='' as $$
  select private.change_rating_photo(target,action,expected);
$$;
-- The public wrapper must be callable, but its private implementation performs
-- authentication and ownership checks before every operation.
revoke all on function public.change_rating_photo(uuid,text,text) from public,anon;
grant execute on function public.change_rating_photo(uuid,text,text) to authenticated;

create function private.queue_deleted_photo() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if old.path is not null then insert into private.photo_cleanup(path) values(old.path) on conflict do nothing; end if;
  if old.pending_path is not null then insert into private.photo_cleanup(path) values(old.pending_path) on conflict do nothing; end if;
  return old;
end $$;
revoke all on function private.queue_deleted_photo() from public,anon,authenticated;
create trigger queue_deleted_photo after delete on public.rating_photos
for each row execute function private.queue_deleted_photo();

create policy photos_storage_read on storage.objects for select to authenticated
using(bucket_id='rating-photos' and exists(
  select 1 from public.rating_photos p where p.path=name));
-- Only the one reserved, immutable object may be uploaded. No UPDATE policy:
-- overwriting the current image or bypassing a reservation is prohibited.
create policy photos_storage_insert on storage.objects for insert to authenticated
with check(bucket_id='rating-photos' and exists(
  select 1 from public.rating_photos p join public.ratings r on r.id=p.rating_id
  where p.pending_path=name and p.reserved_at>now()-interval '15 minutes'
  and r.created_by=(select auth.uid()) and private.is_group_member(r.group_id)));

-- Cleanup is service-role only and always uses the Storage API, never SQL DELETE
-- on storage.objects. Delay protects against uploads still in flight.
create function public.photo_cleanup_batch() returns setof text
language plpgsql security definer set search_path='' as $$
begin
  -- Lock in the same order as the user RPC (rating, then photo).
  perform r.id from public.ratings r join public.rating_photos p on p.rating_id=r.id
    where p.pending_path is not null and p.reserved_at<now()-interval '1 hour'
    for update of r;
  insert into private.photo_cleanup(path)
    select pending_path from public.rating_photos
    where pending_path is not null and reserved_at<now()-interval '1 hour'
    on conflict do nothing;
  update public.rating_photos set pending_path=null,reserved_at=null
    where pending_path is not null and reserved_at<now()-interval '1 hour';
  return query select q.path from private.photo_cleanup q
    where q.not_before<now() and not exists(
      select 1 from public.rating_photos p where p.path=q.path or p.pending_path=q.path)
    order by q.not_before limit 100;
end $$;
create function public.ack_photo_cleanup(paths text[]) returns void
language sql security definer set search_path='' as $$
  delete from private.photo_cleanup where path=any(paths);
$$;
revoke all on function public.photo_cleanup_batch() from public,anon,authenticated;
revoke all on function public.ack_photo_cleanup(text[]) from public,anon,authenticated;
grant execute on function public.photo_cleanup_batch(),public.ack_photo_cleanup(text[]) to service_role;
