-- Recharj — migration 004: profile fields captured during the pre-signup quiz
-- Run in the Supabase SQL editor after 003_course_rating.sql.

alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists baseline_comfort_score smallint check (baseline_comfort_score between 1 and 10);
alter table profiles add column if not exists primary_pain_type text;
