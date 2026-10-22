import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { CURRENCY, PLANS, TRIAL_DAYS, type PlanId } from '@/constants/plans';
import { MinTapSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { openSubscriptionSettings, startCheckout } from '@/lib/billing';
import { useSubscription } from '@/lib/subscription';

const BENEFITS = [
  'Every piano piece for prayer, meditation and sleep',
  'New music as it is recorded',
  'Background play and sleep timer',
];

export default function PaywallScreen() {
  const theme = useTheme();
  const { user, refreshProfile } = useAuth();
  const { active } = useSubscription();
  const [plan, setPlan] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  async function run(action: () => Promise<void>) {
    setMessage(null);
    setBusy(true);
    try {
      await action(); // leaves for Stripe on success
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Something went wrong.', tone: 'error' });
      setBusy(false);
    }
  }

  function startTrial() {
    if (!user) {
      router.push({ pathname: '/auth', params: { next: '/paywall' } });
      return;
    }
    run(() => startCheckout(plan));
  }

  function restore() {
    if (!user) {
      router.push({ pathname: '/auth', params: { next: '/paywall' } });
      return;
    }
    refreshProfile();
    setMessage({
      text: `We checked again for ${user.email}. If you subscribed with a different email, sign in with that one.`,
      tone: 'info',
    });
  }

  const chosen = PLANS[plan];

  return (
    <Screen>
      <IconButton label="Close" onPress={close} style={styles.close}>
        <Ionicons name="close" size={26} color={theme.textSecondary} />
      </IconButton>

      <View style={styles.header}>
        <AppText variant="title" style={styles.center}>
          Unlock your quiet place
        </AppText>
        <AppText secondary style={styles.center}>
          Unlimited access to the entire piano library.
        </AppText>
      </View>

      {active ? (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <AppText variant="heading">You have the full library</AppText>
          <AppText secondary>Thank you for supporting this music.</AppText>
          <Button
            label="Manage subscription"
            variant="secondary"
            disabled={busy}
            onPress={() => run(openSubscriptionSettings)}
          />
        </View>
      ) : (
        <>
          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b} style={styles.benefit}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.accent} />
                <AppText style={styles.flex}>{b}</AppText>
              </View>
            ))}
          </View>

          <View role="radiogroup" accessibilityLabel="Choose a plan" style={styles.plans}>
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const p = PLANS[id];
              const selected = plan === id;
              return (
                <Pressable
                  key={id}
                  role="radio"
                  aria-checked={selected}
                  accessibilityLabel={`${p.label}, ${p.price} ${CURRENCY} per ${p.per}${p.badge ? `, ${p.badge}` : ''}`}
                  onPress={() => setPlan(id)}
                  style={[
                    styles.plan,
                    {
                      backgroundColor: theme.surface,
                      borderColor: selected ? theme.accent : theme.border,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={selected ? theme.accent : theme.textSecondary}
                  />
                  <View style={styles.flex}>
                    <AppText variant="label">{p.label}</AppText>
                    {p.note ? (
                      <AppText variant="caption" secondary>
                        {p.note}
                      </AppText>
                    ) : null}
                  </View>
                  <View style={styles.priceCol}>
                    <AppText variant="label">{p.price}</AppText>
                    <AppText variant="caption" secondary>
                      per {p.per}
                    </AppText>
                  </View>
                  {p.badge ? (
                    <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
                      <AppText variant="caption" style={{ color: theme.text }}>
                        {p.badge}
                      </AppText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Button label={busy ? 'Opening secure checkout…' : 'Start Free Trial'} onPress={startTrial} disabled={busy} />
          <AppText variant="caption" secondary style={styles.center}>
            {TRIAL_DAYS} days free for new members, then {chosen.price} {CURRENCY} per {chosen.per}. Cancel anytime
            before the trial ends and you won’t be charged.
          </AppText>
        </>
      )}

      {message ? (
        <AppText
          role={message.tone === 'error' ? 'alert' : 'status'}
          style={[styles.center, { color: message.tone === 'error' ? theme.text : theme.accent }]}>
          {message.text}
        </AppText>
      ) : null}

      <View style={styles.footer}>
        {active ? null : <Button label="Restore purchases" variant="quiet" onPress={restore} />}
        <View style={styles.links}>
          <Link href="/terms" style={[styles.link, { color: theme.textSecondary }]}>
            Terms
          </Link>
          <AppText secondary>·</AppText>
          <Link href="/privacy" style={[styles.link, { color: theme.textSecondary }]}>
            Privacy
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  close: { marginLeft: -12, marginBottom: -Spacing.md },
  header: { gap: Spacing.sm, alignItems: 'center' },
  center: { textAlign: 'center' },
  flex: { flex: 1 },
  benefits: { gap: Spacing.sm },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  plans: { gap: Spacing.sm },
  plan: {
    minHeight: MinTapSize + 24,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  priceCol: { alignItems: 'flex-end' },
  badge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  card: { borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.md },
  footer: { alignItems: 'center', gap: Spacing.xs },
  links: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  link: { fontSize: 14, padding: Spacing.sm, textDecorationLine: 'underline' },
});
