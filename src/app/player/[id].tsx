import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { ComingSoon } from '@/components/coming-soon';
import { Cover } from '@/components/cover';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { SeekBar } from '@/components/seek-bar';
import { SleepTimer } from '@/components/sleep-timer';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { ARTIST_NAME, getTrack, type Track } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';
import { useFavourites } from '@/lib/favourites';
import { usePlayer } from '@/lib/player';
import { canPlay } from '@/lib/subscription';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const track = getTrack(id);
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const coverSize = Math.min(Math.min(width, MaxContentWidth) - Spacing.lg * 2, height * 0.36, 320);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen>
      <IconButton label="Close player" onPress={close} style={styles.close}>
        <Ionicons name="chevron-down" size={28} color={theme.textSecondary} />
      </IconButton>
      {!track ? (
        <ComingSoon title="Not found" note="We couldn't find that track." />
      ) : (
        <>
          <View style={styles.top}>
            <Cover track={track} size={coverSize} radius={24} />
            <View style={styles.titles}>
              <AppText variant="title" style={styles.center}>
                {track.title}
              </AppText>
              <AppText secondary style={styles.center}>
                {ARTIST_NAME}
              </AppText>
            </View>
          </View>
          {canPlay(track) ? <Controls track={track} /> : <Locked track={track} />}
        </>
      )}
    </Screen>
  );
}

function Controls({ track }: { track: Track }) {
  const theme = useTheme();
  const player = usePlayer();
  const { isFavourite, toggleFavourite } = useFavourites();
  const isCurrent = player.track?.id === track.id;
  const playing = isCurrent && player.status.playing;
  const loading = isCurrent && player.loading;
  const fav = isFavourite(track.id);
  const { load } = player;

  // Opening the player starts the track (browsers may ask for a tap first; the play button handles that).
  useEffect(() => {
    load(track, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.id]);

  return (
    <View style={styles.controls}>
      <SeekBar
        position={isCurrent ? player.status.currentTime : 0}
        duration={isCurrent && player.status.duration > 0 ? player.status.duration : track.duration_seconds}
        onSeek={player.seekTo}
        disabled={!isCurrent || loading}
      />

      <View style={styles.row}>
        <IconButton
          label={player.repeat ? 'Repeat on' : 'Repeat off'}
          selected={player.repeat}
          onPress={() => player.setRepeat(!player.repeat)}>
          <Ionicons name="repeat" size={24} color={player.repeat ? theme.accent : theme.textSecondary} />
        </IconButton>
        <IconButton label="Back 10 seconds" onPress={() => player.skip(-10)} disabled={!isCurrent}>
          <MaterialIcons name="replay-10" size={32} color={theme.text} />
        </IconButton>
        <IconButton
          label={loading ? 'Loading' : playing ? 'Pause' : 'Play'}
          size={76}
          style={{ backgroundColor: theme.accent }}
          onPress={() => (isCurrent ? player.toggle() : load(track, true))}>
          {loading ? (
            <ActivityIndicator color={theme.onAccent} />
          ) : (
            <Ionicons
              name={playing ? 'pause' : 'play'}
              size={34}
              color={theme.onAccent}
              style={playing ? undefined : styles.playNudge}
            />
          )}
        </IconButton>
        <IconButton label="Forward 10 seconds" onPress={() => player.skip(10)} disabled={!isCurrent}>
          <MaterialIcons name="forward-10" size={32} color={theme.text} />
        </IconButton>
        <IconButton
          label={fav ? 'Remove from favourites' : 'Add to favourites'}
          selected={fav}
          onPress={() => toggleFavourite(track.id)}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={26} color={fav ? theme.accent : theme.textSecondary} />
        </IconButton>
      </View>

      {loading ? (
        <AppText variant="caption" secondary style={styles.center}>
          Preparing your music…
        </AppText>
      ) : null}
      {isCurrent && player.error ? (
        <AppText variant="caption" role="alert" style={[styles.center, { color: theme.text }]}>
          {player.error}
        </AppText>
      ) : null}

      <SleepTimer />
    </View>
  );
}

function Locked({ track }: { track: Track }) {
  return (
    <View style={styles.locked}>
      <AppText secondary style={styles.center}>
        {track.description}
      </AppText>
      <AppText style={styles.center}>This piece is part of the full library.</AppText>
      <Button label="Unlock the full library" icon="unlock" onPress={() => router.push('/paywall')} />
    </View>
  );
}

const styles = StyleSheet.create({
  close: { marginLeft: -12, marginBottom: -Spacing.md },
  top: { alignItems: 'center', gap: Spacing.lg },
  titles: { alignItems: 'center', gap: Spacing.xs },
  center: { textAlign: 'center' },
  controls: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playNudge: { marginLeft: 4 },
  locked: { gap: Spacing.md, alignItems: 'stretch', paddingTop: Spacing.sm },
});
