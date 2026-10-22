import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Simple readable page for legal text: a title, then headed sections. */
export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: [string, string][];
}) {
  const theme = useTheme();
  return (
    <Screen>
      <IconButton
        label="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={theme.textSecondary} />
      </IconButton>
      <AppText variant="title">{title}</AppText>
      <AppText variant="caption" secondary>
        Last updated {updated}
      </AppText>
      {sections.map(([heading, body]) => (
        <View key={heading} style={styles.section}>
          <AppText variant="heading">{heading}</AppText>
          <AppText secondary>{body}</AppText>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { marginLeft: -12, marginBottom: -Spacing.md },
  section: { gap: Spacing.xs },
});
