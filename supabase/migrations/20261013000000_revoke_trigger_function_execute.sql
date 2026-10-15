-- Trigger guard functions are implementation details, not client RPC endpoints.
-- Triggers continue to invoke them without granting callers direct EXECUTE access.
revoke execute on function public.guard_group_member_update() from public, anon, authenticated;
revoke execute on function public.guard_restaurant_update() from public, anon, authenticated;
revoke execute on function public.guard_rating_update() from public, anon, authenticated;
