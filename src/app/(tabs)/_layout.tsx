import Feather from '@expo/vector-icons/Feather';
import { BottomTabBar, Tabs } from 'expo-router/js-tabs';
import { Platform, type ColorValue } from 'react-native';

import { MiniPlayer } from '@/components/mini-player';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const theme = useTheme();
  return (
    <Tabs
      tabBar={(props) => (
        <>
          <MiniPlayer />
          <BottomTabBar {...props} />
        </>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          ...Platform.select({ web: { height: 68, paddingTop: 6, paddingBottom: 10 } }),
        },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16 },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="sun" color={color} /> }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: 'Library', tabBarIcon: ({ color }) => <TabIcon name="music" color={color} /> }}
      />
      <Tabs.Screen
        name="favourites"
        options={{ title: 'Favourites', tabBarIcon: ({ color }) => <TabIcon name="heart" color={color} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', tabBarIcon: ({ color }) => <TabIcon name="user" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: keyof typeof Feather.glyphMap; color: ColorValue }) {
  return <Feather name={name} size={22} color={color as string} />;
}
