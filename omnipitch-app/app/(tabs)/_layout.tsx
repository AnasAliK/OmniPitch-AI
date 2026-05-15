import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[iconStyles.wrap, focused && iconStyles.wrapActive]}>
      <Text style={[iconStyles.emoji, !focused && iconStyles.emojiDim]}>{emoji}</Text>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 44, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  wrapActive: {
    backgroundColor: '#1e3a6e',
  },
  emoji: { fontSize: 17 },
  emojiDim: { opacity: 0.4 },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#060d1a',
          borderTopColor: '#0f1f35',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#2d4a6a',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
        tabBarIconStyle: { marginBottom: -2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Squad',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="trace"
        options={{
          title: 'Trace',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scenarios"
        options={{
          title: 'Scenarios',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
