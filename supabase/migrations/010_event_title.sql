-- Recharj — migration 010: free-text title on an event, given by the user
-- before picking the event type on the add-event screen.
-- Run in the Supabase SQL editor after 009_simplify_subscription_tier.sql.

alter table events add column if not exists title text;
