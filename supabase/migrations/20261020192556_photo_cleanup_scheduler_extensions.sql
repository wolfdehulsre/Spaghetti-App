-- Required for the 15-minute cleanup job, configured separately after Vault.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
