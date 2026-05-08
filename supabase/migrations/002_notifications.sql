-- ============================================
-- NOTIFICATION QUEUE
-- ============================================
create table public.notification_queue (
  id            bigint generated always as identity primary key,
  capsule_id    text not null references public.capsules(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null default 'capsule_ready'
                check (type in ('capsule_ready')),
  status        text not null default 'pending'
                check (status in ('pending', 'sent', 'failed')),
  attempts      int not null default 0,
  last_error    text,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz,

  -- One notification per capsule per type — prevents duplicates
  constraint uq_notification_capsule_type unique (capsule_id, type)
);

-- Fast lookup for processing pending/failed items
create index idx_nq_pending on public.notification_queue(status)
  where status = 'pending';
create index idx_nq_failed on public.notification_queue(status, attempts)
  where status = 'failed';

-- RLS enabled with NO policies = invisible to client (service_role only)
alter table public.notification_queue enable row level security;

-- ============================================
-- EMAIL PREFERENCE ON PROFILES
-- ============================================
alter table public.profiles
  add column email_notifications boolean not null default true;

-- ============================================
-- CRON: Enqueue + trigger edge function daily
-- ============================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'enqueue-capsule-notifications',
  '0 8 * * *',  -- 8:00 AM UTC daily
  $$
    -- 1. Enqueue sealed capsules whose open_date has arrived
    insert into public.notification_queue (capsule_id, user_id, type)
    select c.id, c.user_id, 'capsule_ready'
    from public.capsules c
    join public.profiles p on p.id = c.user_id
    where c.status = 'sealed'
      and c.open_date is not null
      and c.open_date <= current_date
      and p.email_notifications = true
    on conflict (capsule_id, type) do nothing;

    -- 2. Trigger the edge function to process the queue
    perform net.http_post(
      url    := current_setting('app.settings.project_url') || '/functions/v1/send-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body   := '{}'::jsonb
    );
  $$
);
