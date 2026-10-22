import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Temporary placeholder for screens that arrive in a later build step. */
export function ComingSoon({ title, note }: { title: string; note: string }) {
  const theme = useTheme();
  return (
    <View style={styles.box}>
      <Feather name="feather" size={28} color={theme.accent} />
      <AppText variant="title">{title}</AppText>
      <AppText secondary style={styles.note}>
        {note}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl },
  note: { textAlign: 'center', maxWidth: 320 },
});
