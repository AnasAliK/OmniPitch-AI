import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TeamData, Player, analyzePlayer, getBaseline, getCategoryColor } from '@/data/team';
import { useApp } from '@/context/AppContext';

// ─── Team Performance Summary ───────────────────────────────────────────────

// ─── Team Performance Summary ───────────────────────────────────────────────

function FluidBar({ label, value, max, colors, gradColors, diffLabel, teamStyles }: any) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: (value / max) * 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [value, max]);

  const width = fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={teamStyles.chartRow}>
      <View style={teamStyles.chartLabelCol}>
        <Text style={teamStyles.chartLabel}>{label}</Text>
        <Text style={teamStyles.chartValue}>{typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}</Text>
      </View>
      <View style={{ flex: 1, position: 'relative', zIndex: hovered ? 10 : 1 }}>
        <TouchableOpacity
          activeOpacity={1}
          // @ts-ignore
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          style={teamStyles.barContainer}
        >
          <Animated.View style={[teamStyles.barFill, { width }]}>
            <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
          </Animated.View>
        </TouchableOpacity>
        {hovered && diffLabel && (
          <View style={teamStyles.tooltip}>
            <Text style={teamStyles.tooltipText}>{diffLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SegmentedBar({ activePct, recoveryPct, focusPct, counts, teamStyles }: any) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const segments = [
    { pct: activePct, color: '#10b981', label: 'Active', count: counts.Active },
    { pct: recoveryPct, color: '#f59e0b', label: 'Recovery', count: counts.Recovery },
    { pct: focusPct, color: '#8b5cf6', label: 'Focus', count: counts['Technical Focus'] + counts['Tactical Review'] },
  ];

  return (
    <View style={teamStyles.stackedBarContainer}>
      {segments.map((seg, i) => {
        if (seg.pct === 0) return null;
        const isHovered = hoveredIndex === i;
        const isDimmed = hoveredIndex !== null && hoveredIndex !== i;
        return (
          <TouchableOpacity
            key={i}
            activeOpacity={1}
            // @ts-ignore
            onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}
            style={[
              teamStyles.stackedSegment,
              { width: `${seg.pct}%`, backgroundColor: seg.color, opacity: isDimmed ? 0.3 : 1 },
              isHovered && { transform: [{ scaleY: 1.15 }], zIndex: 10 }
            ]}
          >
            {isHovered && (
              <View style={[teamStyles.tooltip, { bottom: 20, alignSelf: 'center', left: 'auto', right: 'auto' }]}>
                <Text style={teamStyles.tooltipText}>{seg.label}: {seg.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AlertHeatmapCell({ value, colors: propColors, teamStyles }: any) {
  const { colors, theme } = useApp();
  const [hovered, setHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: hovered && value > 0 ? 1.02 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [hovered, value]);

  const isDark = theme === 'dark';
  let bg = '';
  let border = '';
  let textColor = '';
  let shadowColor = '';

  if (value === 0) {
    if (isDark) {
      bg = hovered ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.03)';
      border = 'rgba(255, 255, 255, 0.05)';
      textColor = '#475569'; // Muted dark gray
    } else {
      bg = hovered ? 'rgba(15, 23, 42, 0.06)' : 'rgba(15, 23, 42, 0.03)'; // Cool faint gray
      border = 'rgba(15, 23, 42, 0.05)';
      textColor = '#94a3b8'; // Muted light gray
    }
  } else if (value >= 1 && value <= 3) {
    // Low Alert: Orange/Amber
    if (isDark) {
      bg = hovered ? 'rgba(245, 158, 11, 0.28)' : 'rgba(245, 158, 11, 0.2)'; // Soft golden-amber background
      border = 'rgba(245, 158, 11, 0.8)'; // Glowing amber border
      textColor = '#fbbf24'; // Bright amber text
      shadowColor = '#f59e0b';
    } else {
      bg = hovered ? '#fed7aa' : '#ffedd5'; // Orange 200 (hovered) vs Orange 100
      border = 'rgba(249, 115, 22, 0.4)'; // Orange border
      textColor = '#9a3412'; // Deep, saturated burnt orange/dark rust (orange 800)
      shadowColor = '#f97316';
    }
  } else {
    // High/Critical Alert: Crimson (value >= 4)
    if (isDark) {
      bg = hovered ? 'rgba(225, 29, 72, 0.28)' : 'rgba(225, 29, 72, 0.2)'; // Deep crimson background
      border = 'rgba(225, 29, 72, 0.8)'; // Glowing red border
      textColor = '#ffffff'; // Stark white text
      shadowColor = '#e11d48';
    } else {
      bg = hovered ? '#be123c' : '#e11d48'; // Rose 700 (hovered) vs Rose 600
      border = '#be123c'; // Rose 700
      textColor = '#ffffff'; // Stark white text
      shadowColor = '#e11d48';
    }
  }

  // Combine web-specific and native styles
  const cellStyle = [
    teamStyles.matrixCell,
    {
      backgroundColor: bg,
      borderColor: border,
      transform: [{ scale: scaleAnim }],
      shadowColor: value > 0 ? shadowColor : 'transparent',
      shadowOpacity: hovered && value > 0 ? 0.4 : 0,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: hovered && value > 0 ? 4 : 0,
    },
    Platform.select({
      web: {
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: value > 0 ? 'pointer' : 'default',
        ...(hovered && value > 0 ? {
          filter: 'brightness(1.15) saturate(1.05)',
          boxShadow: `0 0 12px ${shadowColor}40`,
        } : {}),
      }
    })
  ];

  return (
    <View style={{ flex: 1, zIndex: hovered ? 10 : 1 }}>
      <TouchableOpacity
        activeOpacity={value > 0 ? 0.85 : 1.0}
        // @ts-ignore
        onMouseEnter={() => setHovered(true)} 
        onMouseLeave={() => setHovered(false)}
        style={{ flex: 1 }}
      >
        <Animated.View style={cellStyle}>
          <Text style={[teamStyles.matrixCellText, { color: textColor }]}>
            {value}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

export function TeamPerformanceSummary({ team }: { team: TeamData }) {
  const { colors, theme } = useApp();
  const teamStyles = useMemo(() => createTeamStyles(colors), [colors]);

  let totalGoals = 0;
  let totalXG = 0;
  let statusCounts = { Active: 0, Recovery: 0, 'Technical Focus': 0, 'Tactical Review': 0 };
  
  const alertGrid = {
    ATT: { Technical: 0, Physical: 0, Tactical: 0 },
    MID: { Technical: 0, Physical: 0, Tactical: 0 },
    DEF: { Technical: 0, Physical: 0, Tactical: 0 },
    GK: { Technical: 0, Physical: 0, Tactical: 0 },
  };

  team.players.forEach(p => {
    totalGoals += p.stats.goals;
    totalXG += p.stats.xG;
    statusCounts[p.status as keyof typeof statusCounts] = (statusCounts[p.status as keyof typeof statusCounts] || 0) + 1;

    const analysis = analyzePlayer(p);
    if (analysis.hasIssue) {
      let group: 'ATT' | 'MID' | 'DEF' | 'GK';
      if (['ST', 'LW', 'RW', 'CAM'].includes(p.position)) group = 'ATT';
      else if (['CM', 'CDM'].includes(p.position)) group = 'MID';
      else if (['CB', 'LB', 'RB'].includes(p.position)) group = 'DEF';
      else group = 'GK';

      if (analysis.category !== 'None') {
        alertGrid[group][analysis.category as 'Technical' | 'Physical' | 'Tactical']++;
      }
    }
  });

  const totalPlayers = team.players.length || 1;
  const activePct = (statusCounts.Active / totalPlayers) * 100;
  const recoveryPct = (statusCounts.Recovery / totalPlayers) * 100;
  const focusPct = ((statusCounts['Technical Focus'] + statusCounts['Tactical Review']) / totalPlayers) * 100;

  const maxGoalsXg = Math.max(totalGoals, totalXG, 1);
  const diff = (totalGoals - totalXG).toFixed(1);
  const diffSign = totalGoals >= totalXG ? '+' : '';

  const isLight = theme === 'light';
  const containerBg = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.6)';

  return (
    <View style={[teamStyles.container, { backgroundColor: containerBg }]}>
      <Text style={teamStyles.title}>Squad Performance Analytics</Text>

      <FluidBar 
        label="Goals" 
        value={totalGoals} 
        max={maxGoalsXg} 
        colors={colors} 
        gradColors={['#3b82f6', '#60a5fa']} 
        diffLabel={`Outperforming xG by ${diffSign}${diff}`}
        teamStyles={teamStyles}
      />
      <FluidBar 
        label="Exp. Goals (xG)" 
        value={totalXG} 
        max={maxGoalsXg} 
        colors={colors} 
        gradColors={['#f97316', '#fb923c']} 
        diffLabel={`Expected: ${totalXG.toFixed(1)}`}
        teamStyles={teamStyles}
      />

      {/* Squad Readiness Bar */}
      <Text style={teamStyles.sectionTitle}>Squad Readiness</Text>
      <SegmentedBar 
        activePct={activePct} 
        recoveryPct={recoveryPct} 
        focusPct={focusPct} 
        counts={statusCounts} 
        teamStyles={teamStyles} 
      />
      <View style={teamStyles.legendRow}>
        <View style={teamStyles.legendItem}><View style={[teamStyles.legendDot, { backgroundColor: '#10b981' }]} /><Text style={teamStyles.legendText}>Active</Text></View>
        <View style={teamStyles.legendItem}><View style={[teamStyles.legendDot, { backgroundColor: '#f59e0b' }]} /><Text style={teamStyles.legendText}>Recovery</Text></View>
        <View style={teamStyles.legendItem}><View style={[teamStyles.legendDot, { backgroundColor: '#8b5cf6' }]} /><Text style={teamStyles.legendText}>Focus</Text></View>
      </View>

      {/* Alert Matrix */}
      <Text style={teamStyles.sectionTitle}>Alert Matrix</Text>
      <View style={teamStyles.matrix}>
        <View style={teamStyles.matrixHeaderRow}>
          <Text style={teamStyles.matrixHeaderCell}></Text>
          <Text style={teamStyles.matrixHeaderCell}>TECH</Text>
          <Text style={teamStyles.matrixHeaderCell}>PHYS</Text>
          <Text style={teamStyles.matrixHeaderCell}>TAC</Text>
        </View>
        {['ATT', 'MID', 'DEF', 'GK'].map(group => (
          <View key={group} style={teamStyles.matrixRow}>
            <Text style={teamStyles.matrixRowLabel}>{group}</Text>
            {['Technical', 'Physical', 'Tactical'].map(cat => {
              const val = alertGrid[group as keyof typeof alertGrid][cat as 'Technical' | 'Physical' | 'Tactical'];
              return (
                <AlertHeatmapCell key={cat} value={val} colors={colors} teamStyles={teamStyles} />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Tactical Meter & Upgraded Visuals ────────────────────────────────────────

function TacticalMeter({ label, value, base, max, suffix = '', colors }: any) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const fillAnim = useRef(new Animated.Value(0)).current;
  const isBelow = value < base;

  useEffect(() => {
    fillAnim.setValue(0);
    Animated.timing(fillAnim, {
      toValue: (Math.min(value, max) / max) * 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [value, base, max]);

  const width = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const trackBg = isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(15, 23, 42, 0.08)';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)';
  const tickLeft = `${(base / max) * 100}%`;

  // Gradients: crimson-to-red if below baseline, emerald-to-teal if above
  const gradColors = isBelow ? ['#be123c', '#f43f5e'] : ['#059669', '#14b8a6'];

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'baseline' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#94a3b8' : '#475569' }}>
          {label}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '900', color: isBelow ? '#f43f5e' : '#059669' }}>
          {value.toFixed(0)}{suffix}{' '}
          <Text style={{ fontSize: 9, fontWeight: '500', color: isDark ? '#64748b' : '#94a3b8' }}>
            (Base: {base.toFixed(0)}{suffix})
          </Text>
        </Text>
      </View>
      <View style={{
        height: 10,
        backgroundColor: trackBg,
        borderColor: borderCol,
        borderWidth: 1,
        borderRadius: 5,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 2,
        elevation: 1,
      }}>
        {/* Fill with Gradient */}
        <Animated.View style={{ height: '100%', borderRadius: 5, width }}>
          <LinearGradient
            colors={gradColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        {/* Sharp vertical tick mark overlaid directly on the track */}
        <View style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: tickLeft,
          width: 3,
          backgroundColor: isDark ? '#ffffff' : '#0f172a',
          zIndex: 5,
          shadowColor: '#fff',
          shadowOpacity: isDark ? 0.8 : 0.2,
          shadowRadius: 2,
        }} />
      </View>
    </View>
  );
}

export function PlayerStatBars({ player }: { player: Player }) {
  const { colors } = useApp();
  const baseline = getBaseline(player.position);
  const s = player.stats;

  const duelRate = s.groundDuelsTotal > 0 ? s.groundDuelsWon / s.groundDuelsTotal : 0;
  const passAcc = s.passingAccuracy || 0;
  
  const statsToRender = [
    { label: 'Pass Accuracy', value: passAcc, base: baseline.minPassAcc, max: 100, suffix: '%' },
    { label: 'Duel Win Rate', value: duelRate * 100, base: baseline.minDuelRate * 100, max: 100, suffix: '%' },
  ];

  if (baseline.minConversion !== undefined) {
    const convRate = s.shotsTotal > 0 ? (s.goals / s.shotsTotal) * 100 : 0;
    statsToRender.push({ label: 'Conversion', value: convRate, base: baseline.minConversion * 100, max: 100, suffix: '%' });
  }

  if (baseline.minSavePct !== undefined && s.savePercentage !== undefined) {
    statsToRender.push({ label: 'Save %', value: s.savePercentage, base: baseline.minSavePct, max: 100, suffix: '%' });
  }

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
        Performance vs Baseline
      </Text>
      {statsToRender.map((stat, i) => (
        <TacticalMeter
          key={i}
          label={stat.label}
          value={stat.value}
          base={stat.base}
          max={stat.max}
          suffix={stat.suffix}
          colors={colors}
        />
      ))}
    </View>
  );
}

export function PhysicalOutputTracker({ player }: { player: Player }) {
  const { colors } = useApp();
  const coverageScores = { Wide: 100, Normal: 60, Contracted: 30 };
  const sprintScores = { High: 100, Normal: 60, Low: 30 };
  
  const covScore = coverageScores[player.stats.heatmapCoverage] || 60;
  const sprScore = sprintScores[player.stats.sprintDistance] || 60;

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
        Physical Output
      </Text>
      
      <TacticalMeter
        label={`Area Coverage (${player.stats.heatmapCoverage})`}
        value={covScore}
        base={60}
        max={100}
        suffix="%"
        colors={colors}
      />

      <TacticalMeter
        label={`Sprint Load (${player.stats.sprintDistance})`}
        value={sprScore}
        base={60}
        max={100}
        suffix="%"
        colors={colors}
      />
    </View>
  );
}


// ─── Styles ─────────────────────────────────────────────────────────────────

const createTeamStyles = (colors: any) => StyleSheet.create({
  container: { backgroundColor: colors.bgCardAlt, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.borderSubtle },
  title: { fontSize: 16, fontWeight: '800', color: colors.textTitle, marginBottom: 16 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  chartLabelCol: { width: 100 },
  chartLabel: { fontSize: 11, color: colors.textSub, fontWeight: '600' },
  chartValue: { fontSize: 14, color: colors.textTitle, fontWeight: '800' },
  barContainer: { flex: 1, height: 14, backgroundColor: colors.borderBase, borderRadius: 7, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 7 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: colors.textSub, marginTop: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  stackedBarContainer: { flexDirection: 'row', height: 16, borderRadius: 8, marginBottom: 10, position: 'relative' },
  stackedSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  tooltip: {
    position: 'absolute',
    bottom: '120%',
    left: 0,
    backgroundColor: 'rgba(15,23,42,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  tooltipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  matrix: { marginTop: 4, gap: 8 },
  matrixHeaderRow: { flexDirection: 'row', paddingVertical: 4, gap: 8, marginLeft: 44 },
  matrixHeaderCell: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
  matrixRow: { flexDirection: 'row', gap: 8 },
  matrixRowLabel: { width: 36, textAlign: 'right', marginRight: 8, fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, alignSelf: 'center' },
  matrixCell: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, paddingVertical: 10, borderWidth: 1 },
  matrixCellText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
});

const createBarStyles = (colors: any) => StyleSheet.create({
  container: { marginTop: 16 },
  title: { fontSize: 12, fontWeight: '800', color: colors.textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  statRow: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 12, color: colors.textTitle, fontWeight: '600' },
  value: { fontSize: 12, color: colors.success, fontWeight: '800' },
  baseValue: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  track: { height: 8, backgroundColor: colors.borderBase, borderRadius: 4, position: 'relative' },
  fill: { height: '100%', borderRadius: 4 },
  baselineMarker: { position: 'absolute', top: -2, bottom: -2, width: 2, backgroundColor: colors.textInverse, borderRadius: 1, zIndex: 1 },
});

const createHeatmapStyles = (colors: any) => StyleSheet.create({
  container: { marginTop: 16 },
  title: { fontSize: 12, fontWeight: '800', color: colors.textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
});
