-- Recharj — migration 003: optional course rating
-- Run in the Supabase SQL editor after 002_courses_sources.sql.

alter table course_progress add column if not exists rating smallint check (rating between 1 and 5);
