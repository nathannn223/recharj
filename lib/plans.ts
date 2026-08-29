// Shared pricing data for both the always-available paywall (app/paywall.tsx,
// shown when opening a locked course) and the onboarding trial offer
// (app/onboarding.tsx). Kept in one place so the two screens can never drift
// apart on price or renewal wording.

export type Plan = {
  id: 'monthly' | 'annual';
  name: string;
  // Both plans show the same unit (per month) so the gap reads at a glance,
  // with no mental math: 2,92€ vs 8,99€ needs no calculator.
  perMonth: string;
  strikeThrough?: string;
  detail: string;
  badge?: string;
};

export const PLANS: Plan[] = [
  { id: 'annual', name: 'Annuel', perMonth: '2,92€', strikeThrough: '107,88€', detail: '34,99€ / an', badge: 'Le plus populaire' },
  // The monthly total over a year (8,99€ × 12) made explicit, the same way
  // the "cheap-looking" weekly plan gets called out elsewhere: it only
  // looks affordable until you see the annualized cost next to it.
  { id: 'monthly', name: 'Mensuel', perMonth: '8,99€', detail: '107,88€ / an si payé au mois' },
];

// Required reading before purchase, per App Store guideline 3.1.2(c):
// duration and renewal cadence stated in plain language next to the CTA, not
// only inside the linked Terms.
export const RENEWAL_TEXT: Record<Plan['id'], string> = {
  annual: 'Renouvellement automatique tous les ans à 34,99€, sauf annulation.',
  monthly: 'Renouvellement automatique tous les mois à 8,99€, sauf annulation.',
};

// The onboarding trial screen promises 7 free days on either plan before the
// first charge. TODO(RevenueCat): this is a UI promise only — it needs a
// matching introductory-offer / free-trial configured on both StoreKit
// products in App Store Connect and mirrored in RevenueCat once that account
// exists, or a real purchase will charge immediately instead of after 7 days.
export const TRIAL_DAYS = 7;

export const TRIAL_RENEWAL_TEXT: Record<Plan['id'], string> = {
  annual: `${TRIAL_DAYS} jours offerts, puis 34,99€ / an sauf annulation.`,
  monthly: `${TRIAL_DAYS} jours offerts, puis 8,99€ / mois sauf annulation.`,
};
