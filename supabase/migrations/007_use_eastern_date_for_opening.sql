-- ============================================
-- Use app-local date for capsule opening
-- ============================================

create or replace function public.open_capsule(capsule_id text)
returns void as $$
begin
  update public.capsules
  set status = 'opened', updated_at = now()
  where id = capsule_id
    and user_id = auth.uid()
    and shared_with_email is null
    and status = 'sealed'
    and open_date <= (now() at time zone 'America/New_York')::date;

  if not found then
    raise exception 'Cannot open: capsule not found, not sealed, already sent, or open date not reached.';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.open_shared_capsule(p_share_token text)
returns void as $$
begin
  update public.capsules
  set status = 'opened', updated_at = now()
  where share_token = p_share_token
    and is_private = false
    and status = 'sealed'
    and open_date <= (now() at time zone 'America/New_York')::date
    and lower(shared_with_email) = lower(auth.email());

  if not found then
    raise exception 'Cannot open: capsule not found, not shared, not authorized, or open date not reached.';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.open_capsule(text) from public, anon;
grant execute on function public.open_capsule(text) to authenticated;

revoke execute on function public.open_shared_capsule(text) from public, anon;
grant execute on function public.open_shared_capsule(text) to authenticated;
