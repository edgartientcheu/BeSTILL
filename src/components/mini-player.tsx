import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Cover } from '@/components/cover';
import { IconButton } from '@/components/icon-button';
import { Radius, Spacing } from '@/constants/theme';
import { ARTIST_NAME } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';
import { usePlayer } from '@/lib/player';

/** Small "now playing" bar above the tabs, shown once something has been played. */
export function MiniPlayer() {
  const theme = useTheme();
  const { track, status, loading, toggle } = usePlayer();
  if (!track) return null;

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        role="link"
        accessibilityLabel={`Now playing: ${track.title}. Open player`}
        onPress={() => router.push({ pathname: '/player/[slug]', params: { slug: track.slug } })}
        style={styles.info}>
        <Cover track={track} size={40} radius={Radius.sm} />
        <View style={styles.text}>
          <AppText variant="label" numberOfLines={1}>
            {track.title}
          </AppText>
          <AppText variant="caption" secondary numberOfLines={1}>
            {ARTIST_NAME}
          </AppText>
        </View>
      </Pressable>
      <IconButton label={loading ? 'Loading' : status.playing ? 'Pause' : 'Play'} onPress={toggle}>
        {loading ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <Ionicons name={status.playing ? 'pause' : 'play'} size={26} color={theme.accent} />
        )}
      </IconButton>
      <View style={[styles.progress, { width: `${progress * 100}%`, backgroundColor: theme.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  text: { flex: 1 },
  progress: { position: 'absolute', left: 0, bottom: 0, height: 2 },
});
