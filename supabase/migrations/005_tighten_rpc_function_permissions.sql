-- ============================================
-- RPC permission hardening
-- ============================================

alter function public.handle_new_user() set search_path = public;
alter function public.open_capsule(text) set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke execute on function public.open_capsule(text) from public, anon;
grant execute on function public.open_capsule(text) to authenticated;

revoke execute on function public.open_shared_capsule(text) from public, anon;
grant execute on function public.open_shared_capsule(text) to authenticated;

-- Intentionally callable before login so /shared/:token can show minimal
-- metadata and prompt the recipient to verify their email.
revoke execute on function public.get_share_info(text) from public;
grant execute on function public.get_share_info(text) to anon, authenticated;
