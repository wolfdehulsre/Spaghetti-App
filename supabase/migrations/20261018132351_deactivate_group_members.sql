-- Keep membership and ratings while revoking access to this group.
alter table public.group_members add column active boolean not null default true;
alter table public.group_members add constraint group_owner_must_remain_active check (role <> 'owner' or active);
revoke update(active) on public.group_members from public, anon, authenticated;

-- Retain the existing private membership helpers and their privilege boundary.
create or replace function private.is_group_member(target_group uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.group_members gm
    where gm.group_id=target_group and gm.user_id=(select auth.uid()) and gm.active);
$$;
create or replace function private.is_group_owner(target_group uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.group_members gm
    where gm.group_id=target_group and gm.user_id=(select auth.uid()) and gm.role='owner' and gm.active);
$$;
revoke all on function private.is_group_member(uuid) from public, anon;
revoke all on function private.is_group_owner(uuid) from public, anon;
grant execute on function private.is_group_member(uuid), private.is_group_owner(uuid) to authenticated;

-- Deactivated members must not delete even their own historical ratings.
alter policy ratings_remove_self_or_owner on public.ratings
using ((select private.is_group_member(group_id)) and
  (created_by=(select auth.uid()) or (select private.is_group_owner(group_id))));
