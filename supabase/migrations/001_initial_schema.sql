-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  theme       text not null default 'expressive' check (theme in ('calm', 'expressive')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- CAPSULES
-- ============================================
create table public.capsules (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  message     text not null default '',
  open_date   date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  mood        text,
  tags        text[] default '{}',
  prompt      text,
  status      text not null default 'draft' check (status in ('draft', 'sealed', 'opened')),
  vessel      text default 'capsule',
  is_private  boolean not null default true
);

-- Indexes
create index idx_capsules_user_id on public.capsules(user_id);
create index idx_capsules_user_status on public.capsules(user_id, status);
create index idx_capsules_user_open_date on public.capsules(user_id, open_date);
create index idx_capsules_updated_at on public.capsules(updated_at desc);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.profiles enable row level security;
alter table public.capsules enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Capsules: users can only access their own
create policy "Users can view own capsules"
  on public.capsules for select
  using (auth.uid() = user_id);

create policy "Users can insert own capsules"
  on public.capsules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own capsules"
  on public.capsules for update
  using (auth.uid() = user_id);

create policy "Users can delete own capsules"
  on public.capsules for delete
  using (auth.uid() = user_id);

-- ============================================
-- SAFE VIEW (redacts sealed message content)
-- ============================================
create or replace view public.capsules_safe
with (security_invoker = true) as
select
  id, user_id, title,
  case
    when status = 'draft' then message
    when status = 'opened' then message
    when status = 'sealed' and open_date <= current_date then message
    else ''
  end as message,
  open_date, created_at, updated_at, mood, tags, prompt, status, vessel, is_private,
  (status = 'sealed' and open_date <= current_date) as is_ready
from public.capsules;

-- Grant view access to authenticated users
grant select on public.capsules_safe to authenticated;

-- ============================================
-- SERVER-SIDE OPEN FUNCTION
-- ============================================
create or replace function public.open_capsule(capsule_id text)
returns void as $$
begin
  update public.capsules
  set status = 'opened', updated_at = now()
  where id = capsule_id
    and user_id = auth.uid()
    and status = 'sealed'
    and open_date <= current_date;

  if not found then
    raise exception 'Cannot open: capsule not found, not sealed, or open date not reached.';
  end if;
end;
$$ language plpgsql security definer;
