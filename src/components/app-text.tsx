import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';

export function AppText({
  variant = 'body',
  secondary,
  style,
  ...rest
}: TextProps & { variant?: Variant; secondary?: boolean }) {
  const theme = useTheme();
  return (
    <Text
      role={variant === 'display' || variant === 'title' || variant === 'heading' ? 'heading' : undefined}
      style={[styles[variant], { color: secondary ? theme.textSecondary : theme.text }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: Fonts.serif, fontSize: 40, lineHeight: 46, letterSpacing: 4 },
  title: { fontFamily: Fonts.serif, fontSize: 28, lineHeight: 34 },
  heading: { fontFamily: Fonts.serif, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 20, fontWeight: '600' },
});
