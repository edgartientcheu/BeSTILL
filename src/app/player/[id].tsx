import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ComingSoon } from '@/components/coming-soon';
import { Cover } from '@/components/cover';
import { Screen } from '@/components/screen';
import { MinTapSize, Spacing } from '@/constants/theme';
import { ARTIST_NAME, getTrack } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const track = getTrack(id);
  const theme = useTheme();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!track) {
    return (
      <Screen>
        <ComingSoon title="Not found" note="We couldn't find that track." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable role="button" accessibilityLabel="Close player" onPress={close} style={styles.close}>
        <Feather name="chevron-down" size={28} color={theme.textSecondary} />
      </Pressable>
      <View style={styles.top}>
        <Cover track={track} size={260} radius={24} />
        <AppText variant="title">{track.title}</AppText>
        <AppText secondary>{ARTIST_NAME}</AppText>
      </View>
      <ComingSoon title="Player" note="Play, seek, repeat, favourite and the sleep timer arrive in step 2." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  close: { width: MinTapSize, height: MinTapSize, alignItems: 'center', justifyContent: 'center', marginLeft: -12 },
  top: { alignItems: 'center', gap: Spacing.sm },
});
