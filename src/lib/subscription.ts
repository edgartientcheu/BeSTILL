import type { Track } from '@/data/tracks';
import { useAuth, type Profile } from '@/lib/auth';

/**
 * The ONE place the app decides "is this person a subscriber?". It mirrors the
 * `has_active_subscription` database function the server uses before handing out audio.
 *
 * `profiles.subscription_status` is written by the Stripe webhook (step 4) and, in
 * phase 2, by RevenueCat for Apple/Google purchases. Screens never need to change.
 */
export function hasActiveSubscription(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.is_admin) return true; // the owner hears everything
  const live = profile.subscription_status === 'active' || profile.subscription_status === 'trialing';
  const notExpired = !profile.current_period_end || new Date(profile.current_period_end).getTime() > Date.now();
  return live && notExpired;
}

export function useSubscription() {
  const { profile } = useAuth();
  const active = hasActiveSubscription(profile);
  return {
    active,
    canPlay: (track: Pick<Track, 'is_free'>) => track.is_free || active,
  };
}
