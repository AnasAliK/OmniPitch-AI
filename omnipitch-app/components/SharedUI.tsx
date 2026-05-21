/**
 * Shared UI components for OmniPitch
 * - PageHeader: Unified football-tech header for all tab pages
 * - StatGlassCard: Premium glassmorphism stat chip with optional pulse
 * - SelectorPill: High-tech selector pill with hover/active states
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/context/AppContext';

// ─── Tactical Pitch Lines Background ─────────────────────────────────────────

function PitchDecoration({ theme }: { theme: 'light' | 'dark' }) {
  const lineColor = theme === 'dark'
    ? 'rgba(99,102,241,0.07)'
    : 'rgba(16,185,129,0.08)';

  return (
    <View style={pitchStyles.wrap} pointerEvents="none">
      {/* Outer boundary */}
      <View style={[pitchStyles.outerRect, { borderColor: lineColor }]} />
      {/* Centre line */}
      <View style={[pitchStyles.centreLine, { backgroundColor: lineColor }]} />
      {/* Centre circle */}
      <View style={[pitchStyles.centreCircle, { borderColor: lineColor }]} />
      {/* Centre spot */}
      <View style={[pitchStyles.centreSpot, { backgroundColor: lineColor }]} />
      {/* Penalty area top */}
      <View style={[pitchStyles.penaltyTop, { borderColor: lineColor }]} />
      {/* Goal arc */}
      <View style={[pitchStyles.goalArcTop, { borderColor: lineColor }]} />
    </View>
  );
}

const pitchStyles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  outerRect: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    bottom: -20,
    borderWidth: 1,
    borderRadius: 2,
  },
  centreLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  centreCircle: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    marginLeft: -45,
    marginTop: -45,
  },
  centreSpot: {
    position: 'absolute',
    top: '25%',
    left: '50%',
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: -2.5,
    marginTop: -2.5,
  },
  penaltyTop: {
    position: 'absolute',
    top: 8,
    left: '30%',
    width: '40%',
    height: 55,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 0,
    borderRadius: 1,
  },
  goalArcTop: {
    position: 'absolute',
    top: 48,
    left: '40%',
    width: '20%',
    height: 24,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
});

// ─── Stat Glass Card ──────────────────────────────────────────────────────────

export function StatGlassCard({
  value,
  label,
  color,
  pulse = false,
}: {
  value: string | number;
  label: string;
  color?: string;
  pulse?: boolean;
}) {
  const { theme } = useApp();
  const isLight = theme === 'light';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.55, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const accent = color ?? '#3b82f6';
  const bg = isLight ? `rgba(${hexToRgb(accent)},0.08)` : `rgba(${hexToRgb(accent)},0.12)`;
  const border = isLight ? `rgba(${hexToRgb(accent)},0.20)` : `rgba(${hexToRgb(accent)},0.28)`;

  return (
    <View style={[statStyles.card, { backgroundColor: bg, borderColor: border }]}>
      <Animated.Text style={[statStyles.value, { color: accent, opacity: pulseAnim }]}>
        {value}
      </Animated.Text>
      <Text style={[statStyles.label, { color: accent + 'aa' }]}>{label}</Text>
    </View>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const statStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  value: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 3,
  },
});

// ─── Selector Pill ────────────────────────────────────────────────────────────

export function SelectorPill({
  label,
  isActive,
  onPress,
  accentColor,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  accentColor?: string;
}) {
  const { theme, colors } = useApp();
  const isLight = theme === 'light';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  const accent = accentColor ?? '#3b82f6';

  useEffect(() => {
    Animated.spring(translateYAnim, {
      toValue: hovered && !isActive ? -2 : 0,
      friction: 8, tension: 140, useNativeDriver: true,
    }).start();
  }, [hovered, isActive]);

  const pressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.92, friction: 6, tension: 200, useNativeDriver: true }).start();

  const pressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();

  const activeBg = isActive ? accent : 'transparent';
  const activeBorder = isActive ? accent : (isLight ? 'rgba(59,130,246,0.18)' : 'rgba(99,102,241,0.22)');
  const textColor = isActive ? '#fff' : (hovered ? accent : (isLight ? '#475569' : '#94a3b8'));
  const shadowOpacity = isActive ? 0.35 : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      // @ts-ignore
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); pressOut(); }}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          pillStyles.pill,
          {
            backgroundColor: activeBg,
            borderColor: activeBorder,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            shadowColor: accent,
            shadowOpacity,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: isActive ? 8 : 0,
          },
        ]}
      >
        <Text style={[pillStyles.label, { color: textColor, fontWeight: isActive ? '800' : '500' }]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 3,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
});

// ─── Page Header ──────────────────────────────────────────────────────────────

export function PageHeader({
  kicker,
  title,
  subtitle,
  stats,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  stats?: { value: string | number; label: string; color?: string; pulse?: boolean }[];
}) {
  const { theme, colors } = useApp();
  const { width } = useWindowDimensions();
  const isLight = theme === 'light';
  const isMobile = width < 768;

  const gradColors: [string, string] = isLight
    ? [colors.heroGrad1, colors.heroGrad2]
    : [colors.heroGrad1, colors.heroGrad2];

  const overlayColors: [string, string] = isLight
    ? ['rgba(16,185,129,0.06)', 'rgba(59,130,246,0.04)']
    : ['rgba(99,102,241,0.10)', 'rgba(59,130,246,0.06)'];

  return (
    <LinearGradient
      colors={gradColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={headerStyles.container}
    >
      {/* Tactical pitch background pattern */}
      <PitchDecoration theme={theme} />

      {/* Accent overlay */}
      <LinearGradient
        colors={overlayColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[headerStyles.row, isMobile ? { flexDirection: 'column', alignItems: 'flex-start' } : {}]}>
        {/* Left: text content */}
        <View style={[headerStyles.leftCol, isMobile ? { paddingRight: 0, marginBottom: 12 } : {}]}>
          <Text style={[headerStyles.kicker, { color: isLight ? '#10b981' : '#6366f1' }]}>
            {kicker}
          </Text>
          <Text style={[headerStyles.title, { color: colors.textTitle, fontSize: isMobile ? 20 : 26 }]}>{title}</Text>
          {subtitle && (
            <Text style={[headerStyles.subtitle, { color: colors.textSub }]}>{subtitle}</Text>
          )}
        </View>

        {/* Right: stat glass cards */}
        {stats && stats.length > 0 && (
          <View style={[headerStyles.statsCol, isMobile ? { maxWidth: '100%', justifyContent: 'flex-start' } : {}]}>
            {stats.map((s, i) => (
              <StatGlassCard key={i} value={s.value} label={s.label} color={s.color} pulse={s.pulse} />
            ))}
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 22,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    paddingRight: 12,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 5,
  },
  statsCol: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 160,
  },
});

// ─── Live Pulse Indicator ─────────────────────────────────────────────────────

export function LivePulseIndicator({ lastUpdated }: { lastUpdated?: string | null }) {
  const { theme, colors } = useApp();
  const isLight = theme === 'light';
  
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const bg = isLight ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.15)';
  const border = isLight ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.4)';

  const timeText = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
    : 'LOCAL MOCK DATA';

  return (
    <View style={[pulseStyles.container, { backgroundColor: bg, borderColor: border }]}>
      <View style={pulseStyles.iconContainer}>
        {/* Pulsing rings */}
        <Animated.View style={[pulseStyles.ring, { transform: [{ scale }], opacity }]} />
        <Text style={{ fontSize: 12, position: 'absolute' }}>📡</Text>
      </View>
      <View style={pulseStyles.textContainer}>
        <Text style={pulseStyles.title}>LIVE DATA STREAM</Text>
        <Text style={pulseStyles.subtitle}>LAST EXTRACTED: {timeText}</Text>
      </View>
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    position: 'absolute',
  },
  ring: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    position: 'absolute',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
});

