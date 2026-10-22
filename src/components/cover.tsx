import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { CategoryId, Track } from '@/data/tracks';

/** Soft two-tone gradients used until real cover art is uploaded. */
const GRADIENTS: Record<CategoryId, [string, string]> = {
  prayer: ['#E9DCC7', '#B9C7B5'],
  meditation: ['#D9DEE6', '#A9B8B0'],
  sleep: ['#3E4A5C', '#7C8696'],
  scripture: ['#E6D6C6', '#C3A98F'],
  focus: ['#DCE3D5', '#8FA493'],
};

export function Cover({ track, size, radius = 16 }: { track: Track; size: number; radius?: number }) {
  const box = { width: size, height: size, borderRadius: radius };
  if (track.cover_path) {
    return <Image source={{ uri: track.cover_path }} style={box} contentFit="cover" accessible={false} />;
  }
  return (
    <LinearGradient colors={GRADIENTS[track.category]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={box}>
      <View style={styles.center}>
        <Feather name="music" size={Math.round(size * 0.22)} color="rgba(255,255,255,0.7)" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
