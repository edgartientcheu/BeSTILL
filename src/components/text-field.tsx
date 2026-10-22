import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/app-text';
import { Fonts, MinTapSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A labelled text box. The visible label doubles as the screen-reader label. */
export function TextField({ label, ...rest }: TextInputProps & { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  input: {
    minHeight: MinTapSize + 4,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.sans,
    fontSize: 16, // 16+ stops iPhones zooming into the field
  },
});
