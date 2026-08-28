-- Recharj — migration 005: what stops the user from taking care of their social battery
-- Run in the Supabase SQL editor after 004_onboarding_profile.sql.

alter table profiles add column if not exists obstacles text[];
