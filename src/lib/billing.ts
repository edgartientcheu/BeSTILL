import { Platform } from 'react-native';

import type { PlanId } from '@/constants/plans';
import { functionError, supabase } from '@/lib/supabase';

/**
 * Web subscriptions go through Stripe Checkout and the Stripe Customer Portal.
 * Phase 2: iPhone/Android use RevenueCat (Apple/Google in-app purchases) here instead;
 * both end up updating `profiles`, so hasActiveSubscription() never changes.
 */
async function openStripePage(fn: 'create-checkout-session' | 'create-portal-session', body?: object) {
  if (Platform.OS !== 'web') throw new Error('Subscriptions in the phone app are coming soon.');
  if (!supabase) throw new Error('Payments are not set up yet.');
  const { data, error } = await supabase.functions.invoke<{ url: string }>(fn, { body: body ?? {} });
  if (error || !data?.url)
    throw new Error(await functionError(error, 'We couldn’t reach the payment service. Please try again.'));
  window.location.assign(data.url);
}

export const startCheckout = (plan: PlanId) => openStripePage('create-checkout-session', { plan });
export const openSubscriptionSettings = () => openStripePage('create-portal-session');
