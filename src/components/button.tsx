import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { AppText } from '@/components/app-text';
import { MinTapSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  variant?: 'primary' | 'secondary' | 'quiet';
};

export function Button({ label, icon, variant = 'primary', style, ...rest }: Props) {
  const theme = useTheme();
  const fg = variant === 'primary' ? theme.onAccent : variant === 'secondary' ? theme.text : theme.accent;
  const bg = variant === 'primary' ? theme.accent : variant === 'secondary' ? theme.surfaceMuted : 'transparent';
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      style={(state) => [
        styles.base,
        { backgroundColor: bg, opacity: rest.disabled ? 0.5 : state.pressed ? 0.8 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {icon ? <Feather name={icon} size={18} color={fg} /> : null}
      <AppText variant="label" style={{ color: fg }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MinTapSize,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
});
