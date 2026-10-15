alter table public.ratings add column client_submission_id uuid not null default gen_random_uuid();
alter table public.ratings add column legacy_id text;
create unique index ratings_submission_id_unique on public.ratings(group_id, created_by, client_submission_id);
create unique index ratings_legacy_import_unique on public.ratings(group_id, created_by, legacy_id);
create or replace function public.guard_rating_update() returns trigger language plpgsql set search_path='' as $$ begin if new.id<>old.id or new.group_id<>old.group_id or new.created_by<>old.created_by or new.created_at<>old.created_at or new.client_submission_id<>old.client_submission_id or new.legacy_id is distinct from old.legacy_id then raise exception 'Rating identity, group, creator and submission keys are immutable'; end if; new.updated_at:=now(); return new; end; $$;

