import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLibrary } from '@/lib/library';

/** Calm loading / error message while the music library loads. Renders nothing once ready. */
export function LibraryState() {
  const theme = useTheme();
  const { loading, error, reload } = useLibrary();
  if (loading) {
    return (
      <View style={styles.box} role="status">
        <ActivityIndicator color={theme.accent} />
        <AppText secondary>Gathering the music…</AppText>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.box} role="alert">
        <AppText secondary style={styles.center}>
          {error}
        </AppText>
        <Button label="Try again" variant="secondary" onPress={reload} />
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  center: { textAlign: 'center' },
});
