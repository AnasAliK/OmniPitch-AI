import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useApp } from '@/context/AppContext';

function TabIcon({ emoji, focused, colors }: { emoji: string; focused: boolean; colors: any }) {
  const iconStyles = useMemo(() => StyleSheet.create({
    wrap: {
      width: 44, height: 30, borderRadius: 15,
      alignItems: 'center', justifyContent: 'center',
    },
    wrapActive: {
      backgroundColor: colors.borderSubtle,
    },
    emoji: { fontSize: 17 },
    emojiDim: { opacity: 0.4 },
  }), [colors]);

  return (
    <View style={[iconStyles.wrap, focused && iconStyles.wrapActive]}>
      <Text style={[iconStyles.emoji, !focused && iconStyles.emojiDim]}>{emoji}</Text>
    </View>
  );
}



export default function TabLayout() {
  const { colors } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.borderBase,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
        tabBarIconStyle: { marginBottom: -2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Squad',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} colors={colors} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} colors={colors} />,
        }}
      />
      <Tabs.Screen
        name="trace"
        options={{
          title: 'Trace',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" focused={focused} colors={colors} />,
        }}
      />
      <Tabs.Screen
        name="scenarios"
        options={{
          title: 'Scenarios',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" focused={focused} colors={colors} />,
        }}
      />
    </Tabs>
  );
}
