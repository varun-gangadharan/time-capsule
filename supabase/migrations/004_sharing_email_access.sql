-- ============================================
-- SHARING: email-based access control
-- Replaces anonymous link sharing with recipient email verification
-- ============================================

-- Add recipient email column
alter table public.capsules
  add column if not exists shared_with_email text;

create index if not exists idx_capsules_shared_with_email
  on public.capsules(shared_with_email)
  where shared_with_email is not null;

-- Drop the old "anyone can view" policy (from 003_sharing)
drop policy if exists "Anyone can view shared capsules by token" on public.capsules;

-- New policy: only the verified recipient can view
drop policy if exists "Shared recipient can view capsule" on public.capsules;

create policy "Shared recipient can view capsule"
  on public.capsules for select
  using (
    is_private = false
    and share_token is not null
    and shared_with_email is not null
    and lower(shared_with_email) = lower(auth.email())
  );

-- Recreate view with shared_with_email
drop view if exists public.capsules_safe;

create view public.capsules_safe
with (security_invoker = true) as
select
  id, user_id, title,
  case
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

-- ============================================
-- RPC: get minimal share info (no auth required)
-- Returns email hint + capsule title so the shared page
-- can prompt the recipient to verify their email.
-- ============================================
create or replace function public.get_share_info(p_share_token text)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'exists', true,
    'email_hint',
      case
        when c.shared_with_email is not null and position('@' in c.shared_with_email) > 1 then
          left(c.shared_with_email, least(2, position('@' in c.shared_with_email) - 1))
          || '***@'
          || split_part(c.shared_with_email, '@', 2)
        else null
      end,
    'title', c.title,
    'status', c.status,
    'is_ready', (c.status = 'sealed' and c.open_date <= current_date),
    'open_date', c.open_date
  ) into result
  from public.capsules c
  where c.share_token = p_share_token
    and c.is_private = false
    and c.shared_with_email is not null;

  if result is null then
    return json_build_object('exists', false);
  end if;

  return result;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.get_share_info(text) to anon;
grant execute on function public.get_share_info(text) to authenticated;

-- ============================================
-- Update open_shared_capsule to also verify email
-- ============================================
create or replace function public.open_shared_capsule(p_share_token text)
returns void as $$
begin
  update public.capsules
  set status = 'opened', updated_at = now()
  where share_token = p_share_token
    and is_private = false
    and status = 'sealed'
    and open_date <= current_date
    and lower(shared_with_email) = lower(auth.email());

  if not found then
    raise exception 'Cannot open: capsule not found, not shared, not authorized, or open date not reached.';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.open_shared_capsule(text) to authenticated;
