-- Recharj — migration 002: sources + course levels/tiers
-- Run this in the Supabase SQL editor after schema.sql. Extends the
-- `courses` table rather than rewriting it, per consignes-implementation-cours.md.

-- ---------------------------------------------------------------------
-- sources: one row per study/technique, reused across course cards.
-- ---------------------------------------------------------------------
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  short_label text not null,
  study_title text not null,
  authors text not null,
  year smallint,
  journal_or_publisher text,
  summary text not null,
  external_url text not null,
  is_scientific boolean not null default true,
  created_at timestamptz not null default now()
);

alter table sources enable row level security;

create policy "Sources are readable by any authenticated user"
  on sources for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- courses: level (1 = base, 2 = deep-dive) and the tier required to
-- unlock it. Level-2 courses always require 'superior' regardless of
-- their level-1 parent's own tier (see consignes-implementation-cours.md).
-- ---------------------------------------------------------------------
alter table courses add column if not exists level smallint not null default 1 check (level in (1, 2));
alter table courses add column if not exists parent_course_id uuid references courses (id);
alter table courses add column if not exists required_tier subscription_tier not null default 'intermediate';
