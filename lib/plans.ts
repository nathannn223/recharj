import type { TFunction } from 'i18next';

// Shared pricing data for both the always-available paywall (app/paywall.tsx,
// shown when opening a locked course) and the onboarding trial offer
// (app/(auth)/index.tsx). Kept in one place so the two screens can never
// drift apart on price or renewal wording. Deliberately holds only raw
// numbers, never display strings — getPlanDisplay() below formats them per
// the app's current language, so a plan reads "2,92 €" in French and
// "€2.92" in English without maintaining two parallel price tables.
export type Plan = { id: 'monthly' | 'annual' };

export const PLANS: Plan[] = [{ id: 'annual' }, { id: 'monthly' }];

export const MONTHLY_PRICE = 8.99;
export const ANNUAL_PRICE = 34.99;
// Both plans show the same unit (per month) so the gap reads at a glance,
// with no mental math.
export const ANNUAL_PER_MONTH = 2.92;
// The monthly total over a year (8.99 × 12) made explicit, the same way the
// "cheap-looking" weekly plan gets called out elsewhere: it only looks
// affordable until you see the annualized cost next to it.
export const YEAR_TOTAL_IF_MONTHLY = 107.88;

// The onboarding trial screen promises 7 free days on either plan before the
// first charge. TODO(RevenueCat): this is a UI promise only — it needs a
// matching introductory-offer / free-trial configured on both StoreKit
// products in App Store Connect and mirrored in RevenueCat once that account
// exists, or a real purchase will charge immediately instead of after 7 days.
export const TRIAL_DAYS = 7;

export function formatPrice(amount: number, language: string): string {
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
}

export type PlanDisplay = {
  id: Plan['id'];
  name: string;
  perMonth: string;
  strikeThrough?: string;
  detail: string;
  badge?: string;
};

/** Formats a Plan for display in the app's current language. Call with the `t` and `i18n.language` from useTranslation(). */
export function getPlanDisplay(plan: Plan, t: TFunction, language: string): PlanDisplay {
  if (plan.id === 'annual') {
    return {
      id: 'annual',
      name: t('paywall.plans.annual'),
      perMonth: formatPrice(ANNUAL_PER_MONTH, language),
      strikeThrough: formatPrice(YEAR_TOTAL_IF_MONTHLY, language),
      detail: t('paywall.annualDetail', { price: formatPrice(ANNUAL_PRICE, language) }),
      badge: t('paywall.badge.popular'),
    };
  }
  return {
    id: 'monthly',
    name: t('paywall.plans.monthly'),
    perMonth: formatPrice(MONTHLY_PRICE, language),
    detail: t('paywall.monthlyWarning', { price: formatPrice(YEAR_TOTAL_IF_MONTHLY, language) }),
  };
}

/** Required reading before purchase, per App Store guideline 3.1.2(c): duration and renewal cadence in plain language next to the CTA. */
export function getRenewalText(planId: Plan['id'], t: TFunction, language: string): string {
  const price = planId === 'annual' ? ANNUAL_PRICE : MONTHLY_PRICE;
  return t(`paywall.renewal.${planId}`, { price: formatPrice(price, language) });
}

export function getTrialRenewalText(planId: Plan['id'], t: TFunction, language: string): string {
  const price = planId === 'annual' ? ANNUAL_PRICE : MONTHLY_PRICE;
  return t(`paywall.trialRenewal.${planId}`, { days: TRIAL_DAYS, price: formatPrice(price, language) });
}
