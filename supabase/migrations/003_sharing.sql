-- ============================================
-- SHARING: add share token support to capsules
-- ============================================

-- Cryptographically random token, nullable (null = not shared)
alter table public.capsules
  add column share_token text unique;

-- When the share was created
alter table public.capsules
  add column shared_at timestamptz;

-- Fast token lookup (partial index — only rows that are shared)
create index idx_capsules_share_token
  on public.capsules(share_token)
  where share_token is not null;

-- ============================================
-- RLS: allow anonymous SELECT for shared capsules
-- ============================================
create policy "Anyone can view shared capsules by token"
  on public.capsules for select
  using (
    is_private = false
    and share_token is not null
  );

-- ============================================
-- Update capsules_safe view to include new columns
-- (must drop+recreate because column order changed)
-- ============================================
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
  is_private, share_token, shared_at,
  (status = 'sealed' and open_date <= current_date) as is_ready
from public.capsules;

-- Grant view access to both anon and authenticated
grant select on public.capsules_safe to anon;
grant select on public.capsules_safe to authenticated;

-- ============================================
-- RPC: open a shared capsule (no auth required)
-- ============================================
create or replace function public.open_shared_capsule(p_share_token text)
returns void as $$
begin
  update public.capsules
  set status = 'opened', updated_at = now()
  where share_token = p_share_token
    and is_private = false
    and status = 'sealed'
    and open_date <= current_date;

  if not found then
    raise exception 'Cannot open: capsule not found, not shared, not sealed, or open date not reached.';
  end if;
end;
$$ language plpgsql security definer;
