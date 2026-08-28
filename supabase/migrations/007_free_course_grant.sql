-- Recharj — migration 007: the single course granted for free to a user,
-- matched during onboarding to the pain point they picked in the quiz.
-- Run in the Supabase SQL editor after 006_onboarding_social_profile.sql.

alter table profiles add column if not exists free_course_id uuid references courses(id);
