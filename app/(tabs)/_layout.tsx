import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { t } from '@/i18n';
import { colors, font } from '@/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: font.small },
        tabBarStyle: { backgroundColor: colors.surface, minHeight: 60 },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t.tabs.today, tabBarIcon: tabIcon('today-outline') }}
      />
      <Tabs.Screen
        name="routines"
        options={{ title: t.tabs.routines, tabBarIcon: tabIcon('barbell-outline') }}
      />
      <Tabs.Screen
        name="run"
        options={{ title: t.tabs.run, tabBarIcon: tabIcon('walk-outline') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t.tabs.history, tabBarIcon: tabIcon('time-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t.tabs.profile, tabBarIcon: tabIcon('person-outline') }}
      />
    </Tabs>
  );
}
