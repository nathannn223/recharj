-- Recharj — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) once a
-- project exists. Mirrors the tiers and entities described in
-- brief-projet-app.md.

-- ---------------------------------------------------------------------
-- profiles: one row per auth user, holds the subscription tier.
-- ---------------------------------------------------------------------
create type subscription_tier as enum ('free', 'intermediate', 'superior');

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  subscription_tier subscription_tier not null default 'free',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a free-tier profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------
-- events: social events the user has planned, with a felt difficulty
-- (1-10) used to drive the battery projection and course recommendations.
-- ---------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  event_date date not null,
  difficulty smallint not null check (difficulty between 1 and 10),
  created_at timestamptz not null default now()
);

create index if not exists events_user_date_idx on events (user_id, event_date);

alter table events enable row level security;

create policy "Users manage their own events"
  on events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- courses: the 10 launch courses. `content` holds the 4-step structure
-- (hook, diagnostic quiz, content cards, exercise) as JSON so course
-- copy can be authored/edited without a schema migration.
-- `free_tier_included`: true for exactly the one course the free tier
-- gets unlimited access to.
-- `tags`: matched against an event's `type` to power recommendations.
-- ---------------------------------------------------------------------
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  order_index smallint not null,
  tags text[] not null default '{}',
  free_tier_included boolean not null default false,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table courses enable row level security;

create policy "Courses are readable by any authenticated user"
  on courses for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- course_progress: per-user progress through a course.
-- ---------------------------------------------------------------------
create type course_status as enum ('not_started', 'in_progress', 'completed');

create table if not exists course_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  status course_status not null default 'not_started',
  current_step smallint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table course_progress enable row level security;

create policy "Users manage their own course progress"
  on course_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
