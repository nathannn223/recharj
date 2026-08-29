-- Recharj — migration 012: new onboarding question, "when is your social
-- battery lowest during the day". Answer stored for later use in timing the
-- reminder notification requested right after this question in the quiz
-- (app/(auth)/index.tsx, STEP.MOMENT then STEP.NOTIFICATIONS) — the actual
-- scheduled notification is not built yet, this migration only adds the
-- column app/onboarding.tsx writes the answer into.
--
-- Run in the Supabase SQL editor after 011_battery_history.sql.

alter table profiles add column if not exists low_battery_moment text;
