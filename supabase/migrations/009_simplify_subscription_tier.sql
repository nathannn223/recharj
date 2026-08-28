-- Recharj — migration 009: collapse the 3-tier model (free/intermediate/superior)
-- down to 2 (free/premium) — one paid product, billed monthly or annually,
-- not separate feature tiers. Run after 008_event_description.sql.

create type subscription_tier_new as enum ('free', 'premium');

alter table courses alter column required_tier drop default;
alter table courses alter column required_tier type subscription_tier_new
  using (case when required_tier::text = 'free' then 'free' else 'premium' end)::subscription_tier_new;
alter table courses alter column required_tier set default 'premium';

alter table profiles alter column subscription_tier drop default;
alter table profiles alter column subscription_tier type subscription_tier_new
  using (case when subscription_tier::text = 'free' then 'free' else 'premium' end)::subscription_tier_new;
alter table profiles alter column subscription_tier set default 'free';

drop type subscription_tier;
alter type subscription_tier_new rename to subscription_tier;
