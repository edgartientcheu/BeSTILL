import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { CategoryChips } from '@/components/category-chips';
import { Screen } from '@/components/screen';
import { TrackRow } from '@/components/track-row';
import { Spacing } from '@/constants/theme';
import { CATEGORIES, categoryLabel, getTracks, type CategoryId } from '@/data/tracks';
import { canPlay } from '@/lib/subscription';

export default function LibraryScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = CATEGORIES.some((c) => c.id === params.category) ? (params.category as CategoryId) : undefined;
  const tracks = getTracks(category);

  return (
    <Screen>
      <AppText variant="title">{category ? categoryLabel(category) : 'Library'}</AppText>
      <CategoryChips selected={category} showAll />
      <View style={styles.list}>
        {tracks.length === 0 ? (
          <AppText secondary>New music for this moment is coming soon.</AppText>
        ) : (
          tracks.map((t) => <TrackRow key={t.id} track={t} locked={!canPlay(t)} />)
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },
});
