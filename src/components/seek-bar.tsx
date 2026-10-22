import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SeekTimes } from '@/components/seek-times';
import { formatDuration } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';

/** Progress bar people can drag to move through the track (iOS/Android; see seek-bar.web.tsx). */
export function SeekBar({
  position,
  duration,
  onSeek,
  disabled,
}: {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = dragging ?? position;

  return (
    <View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={Math.max(duration, 1)}
        value={shown}
        disabled={disabled}
        onSlidingStart={(v) => setDragging(v)}
        onValueChange={(v) => dragging !== null && setDragging(v)}
        onSlidingComplete={(v) => {
          onSeek(v);
          setDragging(null);
        }}
        minimumTrackTintColor={theme.accent}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.accent}
        accessibilityLabel="Playback position"
        accessibilityValue={{ text: `${formatDuration(shown)} of ${formatDuration(duration)}` }}
      />
      <SeekTimes position={shown} duration={duration} />
    </View>
  );
}

const styles = StyleSheet.create({
  slider: { width: '100%', height: 40 },
});
