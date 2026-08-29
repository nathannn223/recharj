-- Recharj — migration 013: daily check-ins.
--
-- One row per user per day the user actually rated ("Comment s'est passée
-- ta journée ?", 1-10, plus an optional comment). This is the retention
-- mechanic: rating today is what turns today's battery level from a
-- simulation into a real, observed number (see checkInBatteryState() in
-- lib/battery.ts) and is what the calendar's day-detail view shows above
-- that day's events.
--
-- Deliberately a separate table from `battery_days` rather than new columns
-- on it: this holds user-authored content (score + free text), not the
-- computed battery ledger — keeps "what the user wrote" and "what the model
-- computed" from that separable even though the model reads this table.
--
-- Run in the Supabase SQL editor after 012_low_battery_moment.sql.

create table if not exists daily_checkins (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  score smallint not null check (score between 1 and 10),
  comment text,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists daily_checkins_user_day_idx on daily_checkins (user_id, day desc);

alter table daily_checkins enable row level security;

drop policy if exists "Users manage their own check-ins" on daily_checkins;
create policy "Users manage their own check-ins"
  on daily_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
