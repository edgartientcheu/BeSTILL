/**
 * The ONE place the app asks "is this person a subscriber?".
 *
 * Today: always false (no accounts yet).
 * Step 4: reads `profiles.subscription_status` written by the Stripe webhook.
 * Phase 2: also asks RevenueCat for Apple/Google purchases. Screens never change.
 */
export function hasActiveSubscription(): boolean {
  return false;
}

export function canPlay(track: { is_free: boolean }): boolean {
  return track.is_free || hasActiveSubscription();
}
