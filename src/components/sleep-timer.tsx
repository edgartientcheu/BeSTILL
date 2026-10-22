import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { MinTapSize, Radius, Spacing } from '@/constants/theme';
import { formatDuration } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';
import { SLEEP_TIMER_MINUTES, usePlayer } from '@/lib/player';

export function SleepTimer() {
  const theme = useTheme();
  const { sleepEndsAt, startSleepTimer, cancelSleepTimer, canFade } = usePlayer();
  const [open, setOpen] = useState(false);
  const now = useNow(sleepEndsAt !== null);
  const left = sleepEndsAt === null ? 0 : Math.max(0, (sleepEndsAt - now) / 1000);

  return (
    <View style={styles.wrap}>
      <Pressable
        role="button"
        accessibilityLabel={sleepEndsAt ? `Sleep timer, stops in ${formatDuration(left)}` : 'Sleep timer'}
        aria-expanded={open}
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => [styles.toggle, { opacity: pressed ? 0.6 : 1 }]}>
        <Ionicons name="moon-outline" size={18} color={sleepEndsAt ? theme.accent : theme.textSecondary} />
        <AppText variant="label" style={{ color: sleepEndsAt ? theme.accent : theme.textSecondary }}>
          {sleepEndsAt ? `Stops in ${formatDuration(left)}` : 'Sleep timer'}
        </AppText>
      </Pressable>

      {open ? (
        <View style={styles.options}>
          {SLEEP_TIMER_MINUTES.map((m) => (
            <Option
              key={m}
              label={`${m} min`}
              accessibilityLabel={`Stop playing in ${m} minutes`}
              onPress={() => {
                startSleepTimer(m);
                setOpen(false);
              }}
            />
          ))}
          {sleepEndsAt ? (
            <Option
              label="Off"
              accessibilityLabel="Turn off sleep timer"
              onPress={() => {
                cancelSleepTimer();
                setOpen(false);
              }}
            />
          ) : null}
        </View>
      ) : null}
      {open ? (
        <AppText variant="caption" secondary style={styles.note}>
          {canFade
            ? 'The music gently fades out over the last 20 seconds.'
            : 'The music stops when the timer ends. (Fading is not possible in iPhone browsers.)'}
        </AppText>
      ) : null}
    </View>
  );
}

function Option({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { borderColor: theme.border, backgroundColor: pressed ? theme.surfaceMuted : theme.surface },
      ]}>
      <AppText variant="label">{label}</AppText>
    </Pressable>
  );
}

/** Re-renders once a second while `active`, for the countdown. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [active]);
  return now;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: Spacing.sm },
  toggle: {
    minHeight: MinTapSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  option: {
    minHeight: MinTapSize - 4,
    minWidth: 72,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { textAlign: 'center' },
});
