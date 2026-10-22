import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Cover } from '@/components/cover';
import { MinTapSize, Radius, Spacing } from '@/constants/theme';
import { ARTIST_NAME, categoryLabel, formatDuration, type Track } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';

/** One line in a list of tracks. Locked tracks show a small lock instead of the play icon. */
export function TrackRow({ track, locked }: { track: Track; locked: boolean }) {
  const theme = useTheme();
  const a11y = `${track.title}, ${categoryLabel(track.category)}, ${formatDuration(track.duration_seconds)}${
    locked ? ', subscribers only' : ''
  }`;
  return (
    <Pressable
      role="link"
      accessibilityLabel={a11y}
      onPress={() => router.push({ pathname: '/player/[slug]', params: { slug: track.slug } })}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? theme.surfaceMuted : theme.surface }]}>
      <Cover track={track} size={56} radius={Radius.sm} />
      <View style={styles.text}>
        <AppText variant="label" numberOfLines={1}>
          {track.title}
        </AppText>
        <AppText variant="caption" secondary numberOfLines={1}>
          {ARTIST_NAME} · {formatDuration(track.duration_seconds)}
        </AppText>
      </View>
      <Feather
        name={locked ? 'lock' : 'play-circle'}
        size={locked ? 18 : 26}
        color={locked ? theme.textSecondary : theme.accent}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MinTapSize + 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.sm,
    paddingRight: Spacing.md,
    borderRadius: Radius.md,
  },
  text: { flex: 1, gap: 2 },
});
