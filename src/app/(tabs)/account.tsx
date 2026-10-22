import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth, type Profile } from '@/lib/auth';
import { openSubscriptionSettings } from '@/lib/billing';
import { confirm } from '@/lib/confirm';
import { hasActiveSubscription } from '@/lib/subscription';

export default function AccountScreen() {
  const theme = useTheme();
  const { ready, user, profile, refreshProfile, signOut, deleteAccount } = useAuth();
  const { checkout } = useLocalSearchParams<{ checkout?: string }>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = hasActiveSubscription(profile);
  const confirming = checkout === 'success' && !active;

  // Back from Stripe Checkout: Stripe's webhook usually lands within seconds, so check a few times.
  useEffect(() => {
    if (!confirming) return;
    let tries = 0;
    const handle = setInterval(() => {
      tries += 1;
      refreshProfile();
      if (tries >= 15) clearInterval(handle);
    }, 2000);
    return () => clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirming]);

  async function manage() {
    setError(null);
    setBusy(true);
    try {
      await openSubscriptionSettings(); // leaves for Stripe
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={theme.accent} style={styles.loading} />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <AppText variant="title">Account</AppText>
        <AppText secondary>
          Sign in to keep your favourites on every device and to unlock the full piano library.
        </AppText>
        <Button label="Sign in or create an account" onPress={() => router.push('/auth')} />
      </Screen>
    );
  }

  async function onDelete() {
    setError(null);
    const ok = await confirm(
      'Delete your account?',
      'This permanently removes your account and favourites. It cannot be undone.' +
        (active ? '\n\nPlease cancel your subscription first so you are not charged again.' : ''),
      'Delete',
    );
    if (!ok) return;
    try {
      await deleteAccount();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  return (
    <Screen>
      <AppText variant="title">Account</AppText>

      {checkout === 'success' ? (
        <View role="status" style={[styles.card, { backgroundColor: theme.accentSoft }]}>
          <AppText variant="label">
            {active ? 'Welcome to the full library.' : 'Thank you! Confirming your subscription…'}
          </AppText>
          <AppText variant="caption" secondary>
            {active ? 'Every piece is now unlocked. Rest well.' : 'This usually takes a few seconds.'}
          </AppText>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <AppText variant="caption" secondary>
          Signed in as
        </AppText>
        <AppText variant="label">{user.email}</AppText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <AppText variant="caption" secondary>
          Your plan
        </AppText>
        <AppText variant="label">{planLabel(profile)}</AppText>
        {active ? (
          <Button
            label={busy ? 'Opening…' : 'Manage subscription'}
            variant="secondary"
            onPress={manage}
            disabled={busy}
            style={styles.cardButton}
          />
        ) : (
          <Button label="See plans" onPress={() => router.push('/paywall')} style={styles.cardButton} />
        )}
      </View>

      {error ? (
        <AppText role="alert" style={{ color: theme.text }}>
          {error}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button label="Sign out" variant="secondary" icon="log-out" onPress={signOut} />
        <Button label="Delete account" variant="quiet" onPress={onDelete} />
      </View>
    </Screen>
  );
}

function planLabel(profile: Profile | null): string {
  if (!profile) return '…';
  const until = profile.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  if (!hasActiveSubscription(profile)) {
    return profile.subscription_status === 'past_due' ? 'Payment needs attention' : 'Free (preview tracks)';
  }
  if (profile.subscription_status === 'trialing') return until ? `Free trial until ${until}` : 'Free trial';
  return until ? `Full library · renews ${until}` : 'Full library';
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing.xxl },
  card: { borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs },
  cardButton: { marginTop: Spacing.sm, alignSelf: 'flex-start' },
  actions: { gap: Spacing.sm, marginTop: Spacing.md },
});
