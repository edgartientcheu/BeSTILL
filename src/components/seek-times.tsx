import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { formatDuration } from '@/data/tracks';

/** Elapsed and remaining time under the progress bar. */
export function SeekTimes({ position, duration }: { position: number; duration: number }) {
  return (
    <View style={styles.times} aria-hidden>
      <AppText variant="caption" secondary>
        {formatDuration(position)}
      </AppText>
      <AppText variant="caption" secondary>
        -{formatDuration(Math.max(0, duration - position))}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  times: { flexDirection: 'row', justifyContent: 'space-between' },
});
