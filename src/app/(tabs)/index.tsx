import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { CategoryChips } from '@/components/category-chips';
import { Screen } from '@/components/screen';
import { TrackCard } from '@/components/track-card';
import { Spacing } from '@/constants/theme';
import { LibraryState } from '@/components/library-state';
import { useLibrary } from '@/lib/library';
import { useSubscription } from '@/lib/subscription';

export default function HomeScreen() {
  const { tracks } = useLibrary();
  const { canPlay } = useSubscription();
  const firstFree = tracks.find((t) => t.is_free);

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="display">BE STILL</AppText>
        <AppText variant="heading" secondary>
          Take a moment. Breathe. Pray.
        </AppText>
        <AppText secondary style={styles.tagline}>
          Piano music for prayer, meditation & quiet time.
        </AppText>
        {firstFree ? (
          <Button
            label="Listen Free"
            icon="play"
            style={styles.cta}
            onPress={() => router.push({ pathname: '/player/[slug]', params: { slug: firstFree.slug } })}
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <AppText variant="heading">Featured</AppText>
        <LibraryState />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featured}>
          {tracks.map((t) => (
            <TrackCard key={t.id} track={t} locked={!canPlay(t)} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <AppText variant="heading">Find your moment</AppText>
        <CategoryChips />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  tagline: { textAlign: 'center' },
  cta: { marginTop: Spacing.md, minWidth: 200 },
  section: { gap: Spacing.md },
  featured: { gap: Spacing.md },
});
