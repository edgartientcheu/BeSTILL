import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { FavouritesProvider } from '@/lib/favourites';
import { PlayerProvider } from '@/lib/player';

export default function RootLayout() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? Colors.dark : Colors.light;
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.border,
      primary: c.accent,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <PlayerProvider>
        <FavouritesProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="player/[id]" options={{ presentation: 'modal', title: 'Now playing' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal', title: 'Unlock' }} />
            <Stack.Screen name="auth" options={{ presentation: 'modal', title: 'Sign in' }} />
          </Stack>
        </FavouritesProvider>
      </PlayerProvider>
    </ThemeProvider>
  );
}
