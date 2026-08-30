-- Recharj — migration 014: English content for courses and sources.
--
-- Bilingual UI (see lib/i18n.ts) also needs bilingual course/source content,
-- not just translated app chrome. Rather than restructuring the existing
-- `courses.content` jsonb or the flat `sources` text columns, this adds a
-- parallel `_en` column next to each translatable field: the existing
-- column stays French (unchanged meaning, unchanged data), the new column
-- holds the English equivalent. Consumers pick one or the other based on
-- i18n.language. No migration script for existing rows needed — there are
-- no real production users yet, and 002_courses.sql / 001_sources.sql are
-- reseeded wholesale after this runs.
--
-- Run in the Supabase SQL editor after 013_daily_checkins.sql, then rerun
-- supabase/seed/001_sources.sql and supabase/seed/002_courses.sql.

alter table courses add column if not exists title_en text;
alter table courses add column if not exists content_en jsonb;

alter table sources add column if not exists short_label_en text;
alter table sources add column if not exists study_title_en text;
alter table sources add column if not exists authors_en text;
alter table sources add column if not exists journal_or_publisher_en text;
alter table sources add column if not exists summary_en text;
