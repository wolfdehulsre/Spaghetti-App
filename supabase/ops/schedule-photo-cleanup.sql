-- Run as postgres AFTER applying migrations, deploying cleanup-rating-photos,
-- and configuring Vault. The function checks the token in Vault directly.
-- Vault must contain: photo_project_url, photo_anon_key (legacy JWT anon key),
-- photo_cleanup_secret (a cryptographically random token of at least 32 characters).
-- No secret values are embedded in cron.job.command.
do $$ begin
  if (select count(*) from vault.decrypted_secrets where name in
      ('photo_project_url','photo_anon_key','photo_cleanup_secret'))<>3 then
    raise exception 'Configure the three photo cleanup Vault secrets first';
  end if;
end $$;
select cron.schedule('cleanup-rating-photos','*/15 * * * *',$job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='photo_project_url') || '/functions/v1/cleanup-rating-photos',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='photo_anon_key'),
      'x-cleanup-secret',(select decrypted_secret from vault.decrypted_secrets where name='photo_cleanup_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
$job$);
