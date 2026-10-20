begin;
create extension if not exists pgtap with schema extensions;
select plan(8);
-- Disposable local fixtures only. The deployed Vault token is never read here.
select vault.create_secret('photo-cleanup-test-token-0000000000000000000000','photo_cleanup_secret');
select is(has_function_privilege('anon','public.photo_cleanup_authorized(text)','execute'),false,'anonymous clients cannot check the cleanup secret');
select is(has_function_privilege('authenticated','public.photo_cleanup_authorized(text)','execute'),false,'members cannot check the cleanup secret');
select is(has_function_privilege('service_role','public.photo_cleanup_authorized(text)','execute'),true,'only the worker service role can check the secret');
set local role service_role;
select is(public.photo_cleanup_authorized('photo-cleanup-test-token-0000000000000000000000'),true,'the configured Vault token authorizes cleanup');
select is(public.photo_cleanup_authorized('wrong-token-0000000000000000000000000000000000'),false,'an incorrect token is rejected');
select is(public.photo_cleanup_authorized(null),false,'a missing token is rejected');
select is(public.photo_cleanup_authorized('short'),false,'short tokens fail closed');
set local role authenticated;
select throws_ok($$select public.photo_cleanup_authorized('photo-cleanup-test-token-0000000000000000000000')$$,'42501',null,'even a member knowing the token cannot use the service-role RPC');
reset role;
select * from finish();
rollback;
