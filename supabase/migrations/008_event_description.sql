-- Recharj — migration 008: optional free-text description on an event,
-- shown when tapping a day in the calendar.
-- Run in the Supabase SQL editor after 007_free_course_grant.sql.

alter table events add column if not exists description text;
