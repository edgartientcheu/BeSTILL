import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Cover } from '@/components/cover';
import { Radius, Spacing } from '@/constants/theme';
import { categoryLabel, type Track } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 148;

/** Square card used in the "Featured" row on the home screen. */
export function TrackCard({ track, locked }: { track: Track; locked: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      role="link"
      onPress={() => router.push({ pathname: '/player/[slug]', params: { slug: track.slug } })}
      accessibilityLabel={`${track.title}, ${categoryLabel(track.category)}${locked ? ', subscribers only' : ''}`}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}>
      <View>
        <Cover track={track} size={SIZE} radius={Radius.md} />
        {locked ? (
          <View style={[styles.lock, { backgroundColor: theme.surface }]}>
            <Feather name="lock" size={12} color={theme.textSecondary} />
          </View>
        ) : null}
      </View>
      <AppText variant="label" numberOfLines={1}>
        {track.title}
      </AppText>
      <AppText variant="caption" secondary numberOfLines={1}>
        {categoryLabel(track.category)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: SIZE, gap: Spacing.xs },
  lock: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
