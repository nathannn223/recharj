-- Recharj — migration 011: persistent daily battery history.
--
-- Until now the projection model in lib/battery.ts restarted from a full
-- battery (BASELINE = 100) on every single call, so the Dashboard's hero
-- gauge read 100% whenever no event was planned for the current day, and
-- past events were loaded then silently ignored.
--
-- This table gives the model a carry-forward state: one row per user per
-- closed day, holding that day's closing level and the elite streak ending
-- on it. lib/batteryStore.ts reads the most recent row strictly before
-- today as its anchor, simulates every missing day up to today (so a user
-- who was away for a week is caught up rather than reset), and upserts the
-- result.
--
-- `level` is a rounded 0-100 integer: the model computes in floating point,
-- but sub-point precision has no product meaning on a gauge displayed as a
-- whole percentage, and the drift it introduces stays under one point per
-- caught-up day.
--
-- Run in the Supabase SQL editor after 010_event_title.sql.

create table if not exists battery_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  level smallint not null check (level between 0 and 100),
  elite_streak smallint not null default 0 check (elite_streak >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists battery_days_user_day_idx on battery_days (user_id, day desc);

alter table battery_days enable row level security;

drop policy if exists "Users manage their own battery history" on battery_days;
create policy "Users manage their own battery history"
  on battery_days for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
