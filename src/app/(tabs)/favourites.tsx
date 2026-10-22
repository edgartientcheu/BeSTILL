import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { TrackRow } from '@/components/track-row';
import { Spacing } from '@/constants/theme';
import { getTrack, type Track } from '@/data/tracks';
import { useFavourites } from '@/lib/favourites';
import { canPlay } from '@/lib/subscription';

export default function FavouritesScreen() {
  const { ids } = useFavourites();
  const tracks = ids.map(getTrack).filter((t): t is Track => !!t);

  return (
    <Screen>
      <AppText variant="title">Favourites</AppText>
      {tracks.length === 0 ? (
        <AppText secondary>Tap the heart on any track and it will rest here.</AppText>
      ) : (
        <View style={styles.list}>
          {tracks.map((t) => (
            <TrackRow key={t.id} track={t} locked={!canPlay(t)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
});
