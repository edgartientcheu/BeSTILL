import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { MinTapSize, Radius, Spacing } from '@/constants/theme';
import { CATEGORIES, type CategoryId } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';

/** Horizontally scrolling category filters. `selected` is undefined for "All". */
export function CategoryChips({ selected, showAll }: { selected?: CategoryId; showAll?: boolean }) {
  const theme = useTheme();
  const items: { id?: CategoryId; label: string }[] = [
    ...(showAll ? [{ id: undefined, label: 'All' }] : []),
    ...CATEGORIES,
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}>
      {items.map((c) => {
        const active = c.id === selected;
        return (
          <Pressable
            key={c.label}
            role="button"
            onPress={() => router.navigate(c.id ? { pathname: '/library', params: { category: c.id } } : '/library')}
            aria-selected={active}
            accessibilityLabel={`${c.label} category`}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? theme.accent : pressed ? theme.surfaceMuted : theme.surface,
                borderColor: active ? theme.accent : theme.border,
              },
            ]}>
            <AppText variant="label" style={{ color: active ? theme.onAccent : theme.text }}>
              {c.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0 },
  row: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: {
    minHeight: MinTapSize - 4,
    paddingHorizontal: Spacing.md + 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
});
