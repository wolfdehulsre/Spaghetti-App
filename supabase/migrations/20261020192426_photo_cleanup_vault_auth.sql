-- The cleanup token stays in Vault. Edge checks it through a service-role-only
-- boolean RPC; no endpoint returns the decrypted token.
grant usage on schema private to service_role;
create function private.photo_cleanup_authorized(provided_secret text) returns boolean
language sql stable security definer set search_path='' as $$
  select length(provided_secret) between 32 and 256 and exists(
    select 1 from vault.decrypted_secrets
    where name='photo_cleanup_secret' and length(decrypted_secret)>=32
      and decrypted_secret=provided_secret
  );
$$;
revoke all on function private.photo_cleanup_authorized(text) from public,anon,authenticated;
grant execute on function private.photo_cleanup_authorized(text) to service_role;
create function public.photo_cleanup_authorized(provided_secret text) returns boolean
language sql stable security invoker set search_path='' as $$
  select private.photo_cleanup_authorized(provided_secret);
$$;
revoke all on function public.photo_cleanup_authorized(text) from public,anon,authenticated;
grant execute on function public.photo_cleanup_authorized(text) to service_role;
