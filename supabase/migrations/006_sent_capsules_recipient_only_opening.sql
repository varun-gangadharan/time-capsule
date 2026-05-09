-- ============================================
-- Sent capsules: recipient-only opening/reading
-- ============================================

drop view if exists public.capsules_safe;

create view public.capsules_safe
with (security_invoker = true) as
select
  id, user_id, title,
  case
    when shared_with_email is not null and lower(shared_with_email) <> lower(coalesce(auth.email(), '')) then ''
    when status = 'draft' then message
    when status = 'opened' then message
    when status = 'sealed' and open_date <= current_date then message
    else ''
  end as message,
  open_date, created_at, updated_at, mood, tags, prompt, status, vessel,
  is_private, share_token, shared_at, shared_with_email,
  (status = 'sealed' and open_date <= current_date) as is_ready
from public.capsules;

grant select on public.capsules_safe to anon;
grant select on public.capsules_safe to authenticated;

create or replace function public.open_capsule(capsule_id text)
returns void as $$
begin
  update public.capsules
  set status = 'opened', updated_at = now()
  where id = capsule_id
    and user_id = auth.uid()
    and shared_with_email is null
    and status = 'sealed'
    and open_date <= current_date;

  if not found then
    raise exception 'Cannot open: capsule not found, not sealed, already sent, or open date not reached.';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.open_capsule(text) from public, anon;
grant execute on function public.open_capsule(text) to authenticated;
