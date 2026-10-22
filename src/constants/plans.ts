/** What people see on the paywall. The real prices live in Stripe (and later Apple/Google). */
export const TRIAL_DAYS = 7;
export const CURRENCY = 'CAD';

export type PlanId = 'yearly' | 'monthly';

export const PLANS: Record<PlanId, { label: string; price: string; per: string; note?: string; badge?: string }> = {
  yearly: { label: 'Yearly', price: '$59.99', per: 'year', note: 'Just $5.00 a month', badge: 'Save 28%' },
  monthly: { label: 'Monthly', price: '$6.99', per: 'month' },
};
