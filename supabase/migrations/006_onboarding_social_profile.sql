-- Recharj — migration 006: three follow-up answers from the pre-signup quiz
-- Run in the Supabase SQL editor after 005_onboarding_obstacles.sql.

alter table profiles add column if not exists event_frequency text;
alter table profiles add column if not exists recharge_method text;
alter table profiles add column if not exists anticipation_style text;
