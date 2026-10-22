import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioStatus } from 'expo-audio';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { ARTIST_NAME, type Track } from '@/data/tracks';
import { resolveAudioSource } from '@/lib/audio-source';
import { coverUrl } from '@/lib/supabase';

export const SLEEP_TIMER_MINUTES = [15, 30, 45, 60] as const;
const FADE_MS = 20_000;

/** iPhone/iPad browsers forbid changing volume from a web page, so the fade can't run there. */
const CAN_FADE =
  Platform.OS !== 'web' ||
  !(
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

type PlayerContextValue = {
  track: Track | null;
  status: AudioStatus;
  loading: boolean;
  error: string | null;
  /** Prepares a track; plays immediately when `autoplay` and the browser allows it. */
  load: (track: Track, autoplay: boolean) => Promise<void>;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  skip: (seconds: number) => void;
  repeat: boolean;
  setRepeat: (on: boolean) => void;
  sleepEndsAt: number | null;
  startSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  canFade: boolean;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * One audio player for the whole app, so music keeps going while people browse,
 * lock their phone or switch tabs.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [track, setTrack] = useState<Track | null>(null);
  const [resolving, setResolving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [repeat, setRepeatState] = useState(false);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const loadId = useRef(0);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  // Sleep timer: fade the volume over the final 20 seconds, then pause.
  // Reads the clock on every tick so it stays accurate even if the browser slows timers down.
  useEffect(() => {
    if (sleepEndsAt === null) return;
    const tick = () => {
      const left = sleepEndsAt - Date.now();
      if (left <= 0) {
        player.pause();
        player.volume = 1;
        setSleepEndsAt(null);
      } else if (left <= FADE_MS && CAN_FADE) {
        player.volume = left / FADE_MS;
      }
    };
    tick();
    const handle = setInterval(tick, 250);
    return () => clearInterval(handle);
  }, [player, sleepEndsAt]);

  async function load(next: Track, autoplay: boolean) {
    if (track?.id === next.id && !loadError) {
      if (autoplay && !player.playing) play();
      return;
    }
    const id = ++loadId.current;
    setTrack(next);
    setLoadError(null);
    setResolving(true);
    try {
      const source = await resolveAudioSource(next);
      if (id !== loadId.current) return; // someone tapped another track meanwhile
      player.pause();
      player.replace(source);
      player.loop = repeat;
      player.volume = 1;
      player.setActiveForLockScreen(
        true,
        {
          title: next.title,
          artist: ARTIST_NAME,
          albumTitle: 'BE STILL',
          artworkUrl: coverUrl(next.cover_path) ?? undefined,
        },
        { showSeekBackward: true, showSeekForward: true },
      );
      if (autoplay) player.play();
    } catch (e) {
      if (id === loadId.current) setLoadError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      if (id === loadId.current) setResolving(false);
    }
  }

  function play() {
    // Start again from the top if the track already finished.
    if (player.duration > 0 && player.currentTime >= player.duration - 0.5) player.seekTo(0);
    player.play();
  }

  function toggle() {
    if (!track) return;
    if (player.playing) player.pause();
    else play();
  }

  function seekTo(seconds: number) {
    const max = player.duration || Infinity;
    player.seekTo(Math.min(Math.max(0, seconds), max));
  }

  function setRepeat(on: boolean) {
    setRepeatState(on);
    player.loop = on;
  }

  function startSleepTimer(minutes: number) {
    player.volume = 1;
    setSleepEndsAt(Date.now() + minutes * 60_000);
  }

  function cancelSleepTimer() {
    player.volume = 1;
    setSleepEndsAt(null);
  }

  // A blocked autoplay isn't an error: the listener just taps play.
  const playError = status.error && !/NotAllowed|interact|gesture/i.test(status.error) ? status.error : null;

  const value: PlayerContextValue = {
    track,
    status,
    loading: resolving || (track !== null && !status.isLoaded && !loadError),
    error: loadError ?? (playError ? 'This track could not be played. Please check your connection.' : null),
    load,
    toggle,
    seekTo,
    skip: (seconds) => seekTo(player.currentTime + seconds),
    repeat,
    setRepeat,
    sleepEndsAt,
    startSleepTimer,
    cancelSleepTimer,
    canFade: CAN_FADE,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}
