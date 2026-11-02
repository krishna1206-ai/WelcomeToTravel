import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NATIVE_DRIVER, useReducedMotion } from '@/components/Motion';
import type { IconName } from '@/components/ui';
import { colors, fonts } from '@/theme';

const FOCUSED_SCALE = 1.18;

function TabIcon({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(focused ? FOCUSED_SCALE : 1));

  useEffect(() => {
    if (reduced) return;
    Animated.spring(scale, {
      toValue: focused ? FOCUSED_SCALE : 1,
      stiffness: 300,
      damping: 14,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [scale, focused, reduced]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={name} size={22} color={color as string} />
    </Animated.View>
  );
}

function tabIcon(name: IconName) {
  return function renderIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <TabIcon name={name} color={color} focused={focused} />;
  };
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 16 },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen
        name="tours"
        options={{ title: 'Tours', tabBarIcon: tabIcon('briefcase-outline') }}
      />
      <Tabs.Screen name="build" options={{ title: 'Build', tabBarIcon: tabIcon('add') }} />
      <Tabs.Screen
        name="about"
        options={{ title: 'About', tabBarIcon: tabIcon('information-circle-outline') }}
      />
      <Tabs.Screen
        name="help"
        options={{ title: 'Help', tabBarIcon: tabIcon('chatbubble-outline') }}
      />
    </Tabs>
  );
}
