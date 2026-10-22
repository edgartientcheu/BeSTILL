import { useRef, useState } from 'react';
import { View } from 'react-native';

import { SeekTimes } from '@/components/seek-times';
import { formatDuration } from '@/data/tracks';
import { useTheme } from '@/hooks/use-theme';

/**
 * Browser version of the progress bar: a real <input type="range">, so screen readers
 * announce the position and arrow keys move through the track.
 */
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
  // Keyboard: each arrow press moves 5 s, building on presses the audio hasn't caught up with yet.
  const keyTarget = useRef<{ value: number; at: number } | null>(null);
  const onKeyDown = (e: { key: string; preventDefault: () => void }) => {
    const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 30, PageDown: -30 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const recent = keyTarget.current && Date.now() - keyTarget.current.at < 1000 ? keyTarget.current.value : position;
    const value = Math.min(Math.max(0, recent + step), duration);
    keyTarget.current = { value, at: Date.now() };
    onSeek(value);
  };
  const commit = () => {
    if (dragging === null) return;
    onSeek(dragging);
    setDragging(null);
  };

  return (
    <View>
      <input
        type="range"
        min={0}
        max={Math.max(Math.round(duration), 1)}
        step={1}
        value={Math.round(shown)}
        disabled={disabled}
        aria-label="Playback position"
        aria-valuetext={`${formatDuration(shown)} of ${formatDuration(duration)}`}
        onChange={(e) => setDragging(Number(e.currentTarget.value))}
        onPointerUp={commit}
        onTouchEnd={commit}
        onKeyDown={onKeyDown}
        onBlur={commit}
        style={{ width: '100%', height: 40, margin: 0, accentColor: theme.accent, cursor: 'pointer' }}
      />
      <SeekTimes position={shown} duration={duration} />
    </View>
  );
}
