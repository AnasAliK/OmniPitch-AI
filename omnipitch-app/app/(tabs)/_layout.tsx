import { Tabs } from 'expo-router';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Tab definitions ─────────────────────────────────────────────────────────

const TABS = [
  { name: 'index',     label: 'Squad',     emoji: '👥' },
  { name: 'schedule',  label: 'Schedule',  emoji: '📅' },
  { name: 'trace',     label: 'Trace',     emoji: '🧠' },
  { name: 'scenarios', label: 'Scenarios', emoji: '⚡' },
];

// ─── Floating Pill Tab Bar ────────────────────────────────────────────────────

function FloatingTabBar({ state, navigation }: any) {
  const { theme } = useApp();
  const insets = useSafeAreaInsets();

  const isLight = theme === 'light';
  const pillBg = isLight ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.78)';
  const pillBorder = isLight ? 'rgba(59,130,246,0.20)' : 'rgba(99,102,241,0.28)';
  const ACTIVE_COLOR = '#3b82f6';
  const inactiveColor = isLight ? '#475569' : '#94a3b8';
  const activePillBg = isLight ? 'rgba(59,130,246,0.10)' : 'rgba(59,130,246,0.16)';

  // Measure pill width so we can translate the indicator with pixels (required for native driver)
  const [pillWidth, setPillWidth] = useState(0);
  const tabWidth = pillWidth / TABS.length;

  // Sliding indicator — pixel-based so native driver works
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth <= 0) return;
    Animated.spring(slideAnim, {
      toValue: state.index * tabWidth,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  const onPillLayout = useCallback((e: any) => {
    setPillWidth(e.nativeEvent.layout.width);
    // Jump to initial position without animation
    slideAnim.setValue(state.index * (e.nativeEvent.layout.width / TABS.length));
  }, [state.index]);

  return (
    <View
      style={[styles.outerWrap, { bottom: Math.max(insets.bottom, 12) + 12 }]}
      pointerEvents="box-none"
    >
      <View
        style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}
        onLayout={onPillLayout}
      >
        {/* Sliding active background indicator */}
        {pillWidth > 0 && (
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                width: tabWidth - 8,
                backgroundColor: activePillBg,
                borderColor: ACTIVE_COLOR + '28',
                transform: [{ translateX: slideAnim }],
              },
            ]}
          />
        )}

        {/* Tab buttons */}
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;
          return (
            <TabButton
              key={tab.name}
              tab={tab}
              isFocused={isFocused}
              activeColor={ACTIVE_COLOR}
              inactiveColor={inactiveColor}
              onPress={() => {
                if (!isFocused) {
                  navigation.navigate(tab.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Individual Tab Button ────────────────────────────────────────────────────

function TabButton({
  tab, isFocused, activeColor, inactiveColor, onPress,
}: {
  tab: typeof TABS[number];
  isFocused: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    Animated.spring(translateYAnim, {
      toValue: isHovered && !isFocused ? -2 : 0,
      friction: 10,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [isHovered, isFocused]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.86, friction: 6, tension: 220, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }).start();
  };

  const color = isFocused ? activeColor : inactiveColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      // @ts-ignore — web-only hover events
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); handlePressOut(); }}
      activeOpacity={1}
      style={styles.tabBtn}
    >
      <Animated.View
        style={[
          styles.tabInner,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim },
            ],
          },
        ]}
      >
        <Text style={[styles.tabEmoji, { opacity: isFocused ? 1 : isHovered ? 0.75 : 0.45 }]}>
          {tab.emoji}
        </Text>
        <Text style={[
          styles.tabLabel,
          { color, fontWeight: isFocused ? '800' : '500' },
        ]}>
          {tab.label}
        </Text>
        {/* Active dot */}
        {isFocused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Global Top Bar ───────────────────────────────────────────────────────────

function GlobalTopBar() {
  const { theme, toggleTheme, colors } = useApp();
  const insets = useSafeAreaInsets();
  const isLight = theme === 'light';

  // Rotation animation for icon swap
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [displayDark, setDisplayDark] = useState(theme === 'dark');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setDisplayDark(theme === 'dark');
      rotateAnim.setValue(0);
      fadeAnim.setValue(1);
    });
  }, [theme]);

  const pressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.88, friction: 6, tension: 200, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const barBg = isLight ? 'rgba(255,255,255,0.82)' : 'rgba(10,15,36,0.82)';
  const barBorder = isLight ? 'rgba(59,130,246,0.14)' : 'rgba(99,102,241,0.18)';
  const btnBg = isLight ? 'rgba(241,245,249,0.90)' : 'rgba(30,41,59,0.90)';
  const btnBorder = isLight ? 'rgba(59,130,246,0.22)' : 'rgba(99,102,241,0.32)';
  const brandColor = isLight ? '#3b82f6' : '#6366f1';

  return (
    <View style={[
      topBarStyles.bar,
      {
        paddingTop: Math.max(insets.top, 14) + 2,
        backgroundColor: barBg,
        borderBottomColor: barBorder,
      },
    ]}>
      {/* Brand */}
      <View style={topBarStyles.brandRow}>
        <View style={[topBarStyles.brandDot, { backgroundColor: brandColor }]} />
        <Text style={[topBarStyles.brandText, { color: brandColor }]}>OMNIPITCH AI</Text>
      </View>

      {/* Right cluster: theme toggle */}
      <TouchableOpacity
        onPress={toggleTheme}
        onPressIn={pressIn}
        onPressOut={pressOut}
        // @ts-ignore
        onMouseEnter={() => Animated.spring(scaleAnim, { toValue: 1.08, friction: 8, tension: 120, useNativeDriver: true }).start()}
        onMouseLeave={() => Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start()}
        activeOpacity={1}
        style={[topBarStyles.toggleBtn, { backgroundColor: btnBg, borderColor: btnBorder }]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate: spin }], opacity: fadeAnim }}>
          <Text style={{ fontSize: 16, lineHeight: 20 }}>
            {displayDark ? '🌙' : '☀️'}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const topBarStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 100,
    elevation: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  toggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
});

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Global top bar with brand + theme toggle */}
      <GlobalTopBar />

      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
        tabBar={(props) => <FloatingTabBar {...props} />}
      >
        <Tabs.Screen name="index"     options={{ title: 'Squad' }} />
        <Tabs.Screen name="schedule"  options={{ title: 'Schedule' }} />
        <Tabs.Screen name="trace"     options={{ title: 'Trace' }} />
        <Tabs.Screen name="scenarios" options={{ title: 'Scenarios' }} />
      </Tabs>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
    elevation: 20,
    pointerEvents: 'box-none' as any,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 44,
    borderWidth: 1,
    width: '100%',
    maxWidth: 520,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0.3,
    shadowRadius: 24,
    elevation: 18,
    position: 'relative',
    paddingHorizontal: 4,
    paddingVertical: 6,
    overflow: 'visible',
  },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 4,
    borderRadius: 36,
    borderWidth: 1,
    zIndex: 0,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    zIndex: 1,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabEmoji: {
    fontSize: 18,
    lineHeight: 24,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});

