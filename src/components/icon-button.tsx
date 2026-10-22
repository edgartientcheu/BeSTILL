import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { MinTapSize } from '@/constants/theme';

/** Round, icon-only button. Always give it a spoken `label` for screen readers. */
export function IconButton({
  label,
  children,
  size = MinTapSize,
  selected,
  style,
  ...rest
}: Omit<PressableProps, 'children'> & { label: string; children: ReactNode; size?: number; selected?: boolean }) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      hitSlop={8}
      style={(state) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2, opacity: state.pressed ? 0.6 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
