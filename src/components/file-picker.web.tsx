import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Spacing } from '@/constants/theme';

/** "Choose file" button backed by the browser's own file chooser. */
export function FilePicker({
  label,
  accept,
  file,
  onChange,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <input
        ref={input}
        type="file"
        accept={accept}
        aria-label={label}
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.currentTarget.files?.[0] ?? null)}
      />
      <View style={styles.row}>
        <Button
          label={file ? 'Change file' : 'Choose file'}
          icon="upload"
          variant="secondary"
          onPress={() => input.current?.click()}
        />
        <AppText variant="caption" secondary numberOfLines={1} style={styles.name}>
          {file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : 'No file chosen'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  row: { alignItems: 'flex-start', gap: Spacing.xs },
  name: { alignSelf: 'stretch' },
});
