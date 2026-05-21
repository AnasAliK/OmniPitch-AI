import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Animated,
  Image,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TEAMS, analyzePlayer, getPositionColor, getCategoryColor, getCachedAnalysis, type Player, type AnalysisResult } from '@/data/team';
import { useApp } from '@/context/AppContext';
import { TeamPerformanceSummary, PlayerStatBars, PhysicalOutputTracker } from '@/components/DashboardVisuals';
import { SoccerLoader } from '@/components/SoccerLoader';
import { PageHeader, SelectorPill, LivePulseIndicator } from '@/components/SharedUI';

// ─── Helpers ────────────────────────────────────────────────────────────────

const severityColor: Record<string, string> = {
  none: '#10b981', low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};
const statusColors: Record<string, string> = {
  Active: '#10b981', 'Technical Focus': '#f59e0b', Recovery: '#8b5cf6', 'Tactical Review': '#3b82f6',
};

// ─── Status Pill Color Logic ─────────────────────────────────────────────────

function getStatusPillColors(statusLabel: string, theme: 'light' | 'dark') {
  const isDark = theme === 'dark';
  if (statusLabel === 'OK') return {
    bg: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)',
    border: isDark ? 'rgba(16,185,129,0.55)' : 'rgba(16,185,129,0.45)',
    text: isDark ? '#34d399' : '#059669',
    dot: '#10b981',
  };
  if (statusLabel === 'ALRT' || statusLabel === 'MOD') return {
    bg: isDark ? 'rgba(249,115,22,0.18)' : 'rgba(249,115,22,0.12)',
    border: isDark ? 'rgba(249,115,22,0.65)' : 'rgba(249,115,22,0.45)',
    text: isDark ? '#fb923c' : '#c2410c',
    dot: '#f97316',
  };
  // CRIT
  return {
    bg: isDark ? 'rgba(225,29,72,0.18)' : 'rgba(225,29,72,0.12)',
    border: isDark ? 'rgba(225,29,72,0.65)' : 'rgba(225,29,72,0.45)',
    text: isDark ? '#fb7185' : '#be123c',
    dot: '#e11d48',
  };
}

// ─── Player Row ─────────────────────────────────────────────────────────────

function PlayerRow({ player, onPress, isSelected, hasIntervention, colors, theme }: {
  player: Player; onPress: () => void; isSelected: boolean; hasIntervention: boolean; colors: any; theme: 'light' | 'dark';
}) {
  const [hovered, setHovered] = useState(false);
  const analysis = analyzePlayer(player);
  const posColor = getPositionColor(player.position);
  const hasProblem = analysis.type !== 'none';
  const statusCol = hasIntervention ? '#f97316' : hasProblem ? severityColor[analysis.severity] : '#22c55e';
  const statusLabel = hasIntervention ? 'ALRT' : hasProblem ? (analysis.severity === 'critical' ? 'CRIT' : 'ALRT') : 'OK';
  const pillColors = getStatusPillColors(statusLabel, theme);
  const isDark = theme === 'dark';

  const containerStyle = [
    {
      width: '100%' as const, flexDirection: 'row' as const, alignItems: 'center' as const,
      paddingVertical: 12, paddingHorizontal: 12,
      borderRadius: 14, marginBottom: 0,
      borderWidth: isSelected ? 1.5 : 1,
      borderColor: isSelected
        ? (statusCol + 'CC')
        : hovered
          ? (isDark ? 'rgba(99,102,241,0.35)' : 'rgba(59,130,246,0.3)')
          : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.09)'),
      backgroundColor: isSelected
        ? (isDark ? 'rgba(15,23,42,0.85)' : 'rgba(248,250,252,0.9)')
        : hovered
          ? (isDark ? 'rgba(30,41,59,0.7)' : 'rgba(241,245,249,0.85)')
          : (isDark ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.65)'),
      shadowColor: isSelected ? statusCol : hovered ? '#6366f1' : '#000',
      shadowOpacity: isSelected ? 0.25 : hovered ? 0.12 : 0.04,
      shadowRadius: isSelected ? 10 : 6,
      shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
      elevation: isSelected ? 5 : hovered ? 3 : 1,
      overflow: 'hidden' as const,
      position: 'relative' as const,
    },
    Platform.select({
      web: {
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        transform: hovered && !isSelected ? [{ translateY: -2 }] : [{ translateY: 0 }],
      },
    }),
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      // @ts-ignore
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={containerStyle}
    >
      {/* Active glow left bar */}
      {isSelected && <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: statusCol, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }} />}

      <View style={[{ width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: posColor + '50' }, { backgroundColor: player.avatarColor }]}>
        {player.imageUrl ? (
          <Image source={{ uri: player.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>{player.avatarInitials}</Text>
        )}
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textTitle, letterSpacing: 0.1, marginBottom: 4 }}>{player.shortName}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: posColor + '60' }}>
            <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 0.5, color: posColor }}>{player.position}</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.textSub, fontWeight: '700' }}>#{player.number}</Text>
        </View>
      </View>

      {/* Standardized Status Pill */}
      <View style={[{
        flexDirection: 'row', alignItems: 'center', borderRadius: 8,
        paddingHorizontal: 9, paddingVertical: 5, gap: 5, borderWidth: 1, marginRight: 6,
        backgroundColor: pillColors.bg, borderColor: pillColors.border,
      }, Platform.select({ web: { boxShadow: `0 0 8px ${pillColors.dot}30` } })]}>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: pillColors.dot }} />
        <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 0.8, color: pillColors.text }}>{statusLabel}</Text>
      </View>

      <View style={{ paddingLeft: 4, paddingRight: 4, width: 20, alignItems: 'center' }}>
        <Text style={{ color: isSelected ? statusCol : colors.textMuted, fontSize: 12, fontWeight: '900' }}>{isSelected ? '▲' : '▼'}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Premium Glass Stat Card ──────────────────────────────────────────────────

function StatCard({ value, label, highlight, accent, colors, theme }: {
  value: string; label: string; highlight?: boolean; accent?: string; colors: any; theme: 'light' | 'dark';
}) {
  const isDark = theme === 'dark';
  const accentColor = accent || (highlight ? colors.danger : colors.textTitle);
  return (
    <View style={[
      {
        borderRadius: 14, padding: 14, alignItems: 'center', flex: 1, marginHorizontal: 3,
        borderWidth: 1,
        backgroundColor: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.7)',
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
        shadowColor: accentColor,
        shadowOpacity: highlight ? 0.2 : 0.04,
        shadowRadius: 8, elevation: 2,
        shadowOffset: { width: 0, height: 3 },
      },
      Platform.select({ web: { backdropFilter: 'blur(8px)' } })
    ]}>
      {highlight && <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        backgroundColor: accentColor, borderTopLeftRadius: 14, borderTopRightRadius: 14, opacity: 0.8,
      }} />}
      <Text style={{
        fontSize: 22, fontWeight: '900', color: accentColor,
        letterSpacing: -0.5, lineHeight: 28,
      }}>{value}</Text>
      <Text style={{
        fontSize: 9, color: isDark ? '#64748b' : '#94a3b8',
        marginTop: 5, textAlign: 'center', fontWeight: '700', letterSpacing: 1,
        textTransform: 'uppercase',
      }}>{label}</Text>
    </View>
  );
}

// ─── AI Insight Card (Vulnerability Panel with Scanning Animation) ────────────

function InsightCard({ analysis, severityColor, styles, colors, theme }: any) {
  const scanAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2800,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = scanAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-100%' as any, '200%' as any],
  });

  const sCol = severityColor[analysis.severity];

  return (
    <View style={[styles.insightCard, { borderColor: sCol + '50' }]}>
      {/* Scanning shimmer line */}
      <Animated.View
        style={{
          position: 'absolute', top: 0, bottom: 0, width: '35%',
          transform: [{ translateX }],
          background: `linear-gradient(90deg, transparent, ${sCol}18, transparent)`,
          zIndex: 0,
        } as any}
        pointerEvents="none"
      />

      <View style={[styles.insightHeader, { zIndex: 1 }]}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <Text style={[styles.insightLabel, { color: sCol }]}>{analysis.title}</Text>
        <View style={[styles.confBadge, { backgroundColor: sCol + '22', borderWidth: 1, borderColor: sCol + '40' }]}>
          <Text style={[styles.confText, { color: sCol }]}>{analysis.confidence}%</Text>
        </View>
      </View>
      <Text style={[styles.insightBody, { zIndex: 1 }]}>{analysis.reasoning}</Text>
      <View style={[styles.indicatorRow, { zIndex: 1 }]}>
        {analysis.indicators.map((ind: any, i: number) => (
          <View key={i} style={[styles.indicator, { backgroundColor: ind.color + '18', borderWidth: 1, borderColor: ind.color + '35' }]}>
            <Text style={[styles.indValue, { color: ind.color }]}>{ind.value}</Text>
            <Text style={styles.indLabel}>{ind.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Apply Intervention Button (Gradient + Pulse + Tactile Press) ─────────────

function ApplyButton({ isApplied, isProcessing, pulseAnim, onPress, styles, colors, theme }: any) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isApplied && !isProcessing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isApplied, isProcessing]);

  const shadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const shadowRadius = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 22] });

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, friction: 5 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  if (isApplied) {
    return (
      <View style={[styles.actionBtn, styles.actionBtnDone]}>
        <View style={styles.actionInner}>
          <Text style={{ fontSize: 18 }}>✅</Text>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={[styles.actionText, { color: colors.textMuted }]}>Intervention Applied</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[
      styles.actionBtn,
      isProcessing && styles.actionBtnProc,
      {
        transform: [{ scale: pressAnim }],
        shadowOpacity: isProcessing ? 0.2 : shadowOpacity as any,
        shadowRadius: isProcessing ? 8 : shadowRadius as any,
        shadowColor: '#6366f1',
      },
    ]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isProcessing}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{ borderRadius: 16, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={isProcessing ? ['#4f46e5', '#4338ca'] : ['#3b82f6', '#6366f1', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 18 }}
        >
          <Animated.View style={[styles.actionInner, isProcessing && { opacity: pulseAnim }]}>
            {isProcessing ? (
              <SoccerLoader size={20} text="" />
            ) : (
              <Text style={{ fontSize: 18 }}>🤖</Text>
            )}
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.actionText}>
                {isProcessing ? 'Analyzing...' : 'Apply Intervention'}
              </Text>
              {!isProcessing && (
                <Text style={styles.actionSub}>AI adjusts training schedule</Text>
              )}
            </View>
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────


export default function OmniPitchDashboard() {
  const { selectedTeam, selectedTeamId, switchTeam, applyIntervention, resetIntervention, hasIntervention, overrides, isLoadingTeam, generateAiIntervention, theme, toggleTheme, colors } = useApp();
  
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifPayload, setNotifPayload] = useState<AnalysisResult | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [prefetchedPlayers, setPrefetchedPlayers] = useState<Record<string, boolean>>({});

  // ── First-Visit Welcome Modal ─────────────────────────────────────────────
  const [showWelcome, setShowWelcome] = useState(false);
  const [dataFetchReady, setDataFetchReady] = useState(false);

  // Check localStorage on mount — only runs on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const visited = typeof localStorage !== 'undefined' && localStorage.getItem('hasVisitedOmniPitch');
        if (!visited) {
          setShowWelcome(true); // block data fetch until welcome dismissed
        } else {
          setDataFetchReady(true);
        }
      } catch {
        setDataFetchReady(true); // localStorage unavailable — skip welcome
      }
    } else {
      // On native, always ready
      setDataFetchReady(true);
    }
  }, []);

  // Trigger initial team load once ready (after welcome or immediately on native)
  const hasTriggeredInitialLoad = useRef(false);
  useEffect(() => {
    if (dataFetchReady && !hasTriggeredInitialLoad.current) {
      hasTriggeredInitialLoad.current = true;
      switchTeam(TEAMS[0].id);
    }
  }, [dataFetchReady, switchTeam]);

  const prevIsLoadingTeam = useRef(isLoadingTeam);

  useEffect(() => {
    if (prevIsLoadingTeam.current && !isLoadingTeam && selectedTeam?.players?.length) {
      setShowSyncModal(true);
    }
    prevIsLoadingTeam.current = isLoadingTeam;
  }, [isLoadingTeam, selectedTeam]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Welcome Modal Animations ──────────────────────────────────────────────
  const welcomeOverlayOpacity = useRef(new Animated.Value(0)).current;
  const welcomeScale = useRef(new Animated.Value(0.9)).current;
  const welcomeCardOpacity = useRef(new Animated.Value(0)).current;
  const welcomeH1Fade = useRef(new Animated.Value(0)).current;
  const welcomeSubFade = useRef(new Animated.Value(0)).current;
  const welcomeBtnFade = useRef(new Animated.Value(0)).current;
  const welcomePitchScale = useRef(new Animated.Value(1.08)).current;

  useEffect(() => {
    if (showWelcome) {
      welcomeOverlayOpacity.setValue(0);
      welcomeScale.setValue(0.9);
      welcomeCardOpacity.setValue(0);
      welcomeH1Fade.setValue(0);
      welcomeSubFade.setValue(0);
      welcomeBtnFade.setValue(0);
      welcomePitchScale.setValue(1.08);

      Animated.sequence([
        Animated.timing(welcomeOverlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(welcomeCardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(welcomeScale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
          Animated.timing(welcomePitchScale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.stagger(130, [
          Animated.timing(welcomeH1Fade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(welcomeSubFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(welcomeBtnFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [showWelcome]);

  const closeWelcome = () => {
    Animated.parallel([
      Animated.timing(welcomeCardOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(welcomeOverlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(welcomeScale, { toValue: 0.95, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setShowWelcome(false);
      try { localStorage.setItem('hasVisitedOmniPitch', '1'); } catch {}
      setDataFetchReady(true); // now trigger data fetch
    });
  };

  // ── Glassmorphism Sync Modal Animations ──────────────────────────────────
  const modalScale = useRef(new Animated.Value(0.92)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const headlineFade = useRef(new Animated.Value(0)).current;
  const subtextFade = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (showSyncModal) {
      // Reset
      modalScale.setValue(0.92);
      modalOpacity.setValue(0);
      overlayOpacity.setValue(0);
      headlineFade.setValue(0);
      subtextFade.setValue(0);
      btnFade.setValue(0);
      iconPulse.setValue(0.8);

      Animated.sequence([
        // 1. Overlay fades in
        Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        // 2. Card scales + fades in together
        Animated.parallel([
          Animated.timing(modalOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(modalScale, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
          Animated.timing(iconPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
        // 3. Stagger text elements
        Animated.stagger(120, [
          Animated.timing(headlineFade, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(subtextFade, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(btnFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [showSyncModal]);

  const closeSyncModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(modalScale, { toValue: 0.94, duration: 220, useNativeDriver: true }),
    ]).start(() => setShowSyncModal(false));
  };

  const alertCount = selectedTeam?.players?.filter(p => analyzePlayer(p).hasIssue).length || 0;
  const modifiedCount = Object.keys(overrides).length;

  useEffect(() => {
    // If the selected player isn't in the current team (because team switched), reset it
    if (selectedTeam?.players?.length > 0 && selectedPlayer && !selectedTeam.players.find(p => p.id === selectedPlayer.id)) {
      setSelectedPlayer(null);
    }
  }, [selectedTeam, selectedPlayer?.id]);

  useEffect(() => {
    if (selectedPlayer && hasIntervention(selectedPlayer.id)) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [hasIntervention, selectedPlayer?.id, fadeAnim]);

  useEffect(() => {
    if (isProcessing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isProcessing, pulseAnim]);

  const triggerIntervention = useCallback(async () => {
    if (!selectedPlayer) return;
    const currentAnalysis = analyzePlayer(selectedPlayer);
    if (!currentAnalysis.hasIssue) return;
    
    setIsProcessing(true);
    
    // Fetch hyper-modern AI intervention on-demand via Groq or use cached
    const cached = getCachedAnalysis()[selectedPlayer.id];
    let aiAnalysis = cached;

    if (!aiAnalysis) {
      aiAnalysis = (await generateAiIntervention(selectedPlayer)) || undefined;
    }
    
    setIsProcessing(false);
    
    if (aiAnalysis) {
      setNotifPayload(aiAnalysis);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        applyIntervention(selectedPlayer);
      }, 3500);
    } else {
      // Fallback if AI fails
      setNotifPayload(currentAnalysis);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        applyIntervention(selectedPlayer);
      }, 2500);
    }
  }, [selectedPlayer, applyIntervention, generateAiIntervention]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero Header ── */}
        <PageHeader
          kicker="⚽  SQUAD VIEW"
          title={selectedTeam?.name || 'Squad'}
          subtitle={`🧑‍💼 ${selectedTeam?.manager || 'Manager'}`}
          stats={[
            { value: alertCount, label: 'Alerts', color: alertCount > 0 ? '#ef4444' : '#10b981', pulse: alertCount > 0 },
            ...(modifiedCount > 0 ? [{ value: modifiedCount, label: 'Modified', color: '#f59e0b', pulse: true }] : []),
          ]}
        />

        {/* Team Selector Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 6 }}>
          {TEAMS.map(team => (
            <SelectorPill
              key={team.id}
              label={team.shortName}
              isActive={selectedTeamId === team.id}
              onPress={() => switchTeam(team.id)}
              accentColor="#3b82f6"
            />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 16 }}>
          {isLoadingTeam ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <SoccerLoader text={`Extracting live data for ${TEAMS.find(t => t.id === selectedTeamId)?.shortName}...`} />
            </View>
          ) : !selectedTeam?.players?.length ? (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>No players found.</Text>
          ) : (
            <>
              {/* Live Data Status */}
              <LivePulseIndicator lastUpdated={selectedTeam.lastScrapedAt} />

              {/* Team Performance Visualizations */}
              <TeamPerformanceSummary team={selectedTeam} />

              {/* Roster List */}
              <Text style={styles.sectionLabel}>Squad ({selectedTeam.players.length})</Text>
              <View style={{ paddingBottom: 20 }}>
                {selectedTeam.players.map(p => {
                  const isSel = selectedPlayer?.id === p.id;
                  const hasInt = hasIntervention(p.id);
                  const pAnalysis = analyzePlayer(p);
                  const pIsApplied = hasIntervention(p.id);
                  const pCurrentStatus = pIsApplied ? pAnalysis.intervention.statusChange : p.status;
                  const pStatusColor = statusColors[pCurrentStatus] ?? '#64748b';
                  const pStats = p.stats;
                  const pConvRate = pStats.shotsTotal > 0 ? ((pStats.goals / pStats.shotsTotal) * 100).toFixed(1) : '0';
                  const pDuelRate = pStats.groundDuelsTotal > 0 ? ((pStats.groundDuelsWon / pStats.groundDuelsTotal) * 100).toFixed(0) : '0';
                  const pOverrides = overrides[p.id] ?? [];

                  return (
                    <View key={p.id} style={{ marginBottom: 12 }}>
                      <PlayerRow
                        player={p}
                        isSelected={isSel}
                        hasIntervention={hasInt}
                        colors={colors}
                        theme={theme}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          if (isSel) {
                            setSelectedPlayer(null);
                          } else {
                            setSelectedPlayer(p);
                            fadeAnim.setValue(0);

                            // On-demand fetch
                            const pAnalysis = analyzePlayer(p);
                            if (pAnalysis.hasIssue && !hasIntervention(p.id) && !prefetchedPlayers[p.id]) {
                              setPrefetchedPlayers(prev => ({ ...prev, [p.id]: true }));
                              const cached = getCachedAnalysis()[p.id];
                              if (!cached) {
                                generateAiIntervention(p).catch(console.error);
                              }
                            }
                          }
                        }}
                      />
                      {isSel && (
                        <View style={styles.dropdownDetail}>
                          <View style={styles.detailHeader}>
                            <Text style={styles.sectionLabel}>Player Analysis</Text>
                            <View style={[styles.statusPill, { backgroundColor: pStatusColor + '20', borderColor: pStatusColor + '40', marginBottom: 0 }]}>
                              <View style={[styles.statusDot, { backgroundColor: pStatusColor }]} />
                              <Text style={[styles.statusText, { color: pStatusColor }]}>{pCurrentStatus}</Text>
                            </View>
                          </View>

                          <View style={styles.statsRow}>
                            <StatCard value={String(pStats.goals)} label="Goals" highlight={pAnalysis.category === 'Technical'} accent="#3b82f6" colors={colors} theme={theme} />
                            <StatCard value={String(pStats.xG)} label="xG" accent={colors.textSub} colors={colors} theme={theme} />
                            <StatCard value={String(pStats.assists)} label="Ast" accent="#8b5cf6" colors={colors} theme={theme} />
                            <StatCard value={String(pStats.xA)} label="xA" accent={colors.textSub} colors={colors} theme={theme} />
                          </View>
                          <View style={[styles.statsRow, { marginTop: 6 }]}>
                            <StatCard value={`${pStats.minutesPlayed}'`} label="Mins" highlight={pAnalysis.category === 'Physical'} accent="#f59e0b" colors={colors} theme={theme} />
                            <StatCard value={`${pDuelRate}%`} label="Duels" accent="#06b6d4" colors={colors} theme={theme} />
                            <StatCard value={`${pStats.passingAccuracy}%`} label="Pass" accent="#10b981" colors={colors} theme={theme} />
                            {pStats.savePercentage !== undefined ? (
                              <StatCard value={`${pStats.savePercentage}%`} label="Save" highlight={pAnalysis.category === 'Tactical'} accent="#a855f7" colors={colors} theme={theme} />
                            ) : (
                              <StatCard value={`${pConvRate}%`} label="Conv" highlight={pAnalysis.category === 'Technical'} accent="#ef4444" colors={colors} theme={theme} />
                            )}
                          </View>

                          {/* Enhanced Player Visuals */}
                          <View style={{ flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: '#1a2840', paddingTop: 16, marginBottom: 16 }}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <PlayerStatBars player={p} />
                            </View>
                            <View style={{ flex: 1, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#1a2840' }}>
                              <PhysicalOutputTracker player={p} />
                            </View>
                          </View>

                          {/* Analysis Insight — AI vulnerability card with scanning animation */}
                          {pAnalysis.hasIssue && !pIsApplied && (
                            <InsightCard analysis={pAnalysis} severityColor={severityColor} styles={styles} colors={colors} theme={theme} />
                          )}

                          {/* Intervention Applied — Mapping view */}
                          {pIsApplied && (
                            <Animated.View style={[styles.appliedCard, { opacity: fadeAnim }]}>
                              <View style={styles.appliedHeader}>
                                <Text style={{ fontSize: 20 }}>✅</Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.appliedTitle}>Intervention Applied</Text>
                                  <Text style={styles.appliedScenario}>{pAnalysis.title}</Text>
                                </View>
                              </View>
                              {pOverrides.map((o, i) => {
                                const sessionType = o.replacementSession.type;
                                const leftBorderColor =
                                  sessionType === 'recovery' ? '#06b6d4'
                                  : sessionType === 'tactical' ? '#8b5cf6'
                                  : sessionType === 'individual' ? '#f59e0b'
                                  : sessionType === 'positional' ? '#3b82f6'
                                  : '#10b981';
                                const origLabel =
                                  o.originalSessionId === 'thu-morning' ? 'Team Tactical Session'
                                  : o.originalSessionId === 'thu-afternoon' ? 'Defensive Shape'
                                  : o.originalSessionId === 'thu-gk' ? 'GK Distribution & Shot-Stopping'
                                  : o.originalSessionId === 'fri-morning' ? 'MD-1: Set Pieces'
                                  : o.originalSessionId;
                                return (
                                  <View key={i} style={styles.schedChangeRow}>
                                    {/* Old Schedule — Deprecated */}
                                    <View style={styles.schedOriginal}>
                                      <Text style={styles.schedStrike}>{origLabel}</Text>
                                    </View>
                                    {/* Glowing arrow */}
                                    <Text style={[styles.schedArrow, Platform.select({ web: { textShadow: '0 0 8px #6366f1' } })]}>
                                      →
                                    </Text>
                                    {/* New AI Session Card with left-border color */}
                                    <View style={[styles.schedNew, { borderLeftWidth: 3, borderLeftColor: leftBorderColor, borderColor: leftBorderColor + '30' }]}>
                                      <Text style={styles.schedNewIcon}>{o.replacementSession.icon}</Text>
                                      <View style={{ flex: 1 }}>
                                        <Text style={[styles.schedNewTitle, { color: leftBorderColor }]}>{o.replacementSession.title}</Text>
                                        <Text style={styles.schedNewMeta}>{o.replacementSession.day} {o.replacementSession.time} • {o.replacementSession.duration}</Text>
                                      </View>
                                    </View>
                                  </View>
                                );
                              })}
                              <Text style={styles.appliedHint}>📅 View full schedule in the Schedule tab</Text>
                            </Animated.View>
                          )}

                          {/* Action Button */}
                          {pAnalysis.hasIssue && (
                            <ApplyButton
                              isApplied={pIsApplied}
                              isProcessing={isProcessing}
                              pulseAnim={pulseAnim}
                              onPress={triggerIntervention}
                              styles={styles}
                              colors={colors}
                              theme={theme}
                            />
                          )}

                          {!pAnalysis.hasIssue && (
                            <View style={styles.allGoodCard}>
                              <Text style={{ fontSize: 20 }}>✅</Text>
                              <Text style={styles.allGoodText}>No intervention needed. Performance within baselines.</Text>
                            </View>
                          )}

                          {pIsApplied && (
                            <TouchableOpacity style={styles.resetBtn} onPress={() => resetIntervention(p.id)}>
                              <Text style={styles.resetText}>↻ Reset Intervention</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={{ height: 30 }} />
            </>
          )}
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <Modal transparent visible={showNotification} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTopRow}>
               <Text style={{ fontSize: 32 }}>⚠️</Text>
              <View style={styles.priorBadge}>
                <Text style={styles.priorText}>HIGH PRIORITY</Text>
              </View>
            </View>
            <Text style={styles.modalTitle}>Intervention: {selectedPlayer?.shortName}</Text>
            <Text style={styles.modalBody}>{notifPayload?.reasoning ?? ''}</Text>
            <Text style={styles.modalScheduleNote}>
              📅 Training schedule will be adjusted for the next 48 hours.
            </Text>
            <View style={styles.chipRow}>
              {[selectedTeam?.manager, selectedPlayer?.shortName].map((r, i) => (
                r ? <View key={i} style={styles.chip}><Text style={styles.chipText}>{r}</Text></View> : null
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Welcome Onboarding Modal (First-Visit Only) ── */}
      <Modal transparent visible={showWelcome} animationType="none" statusBarTranslucent>
        <Animated.View style={[styles.welcomeOverlay, { opacity: welcomeOverlayOpacity }]}>
          {/* Blurred pitch background */}
          <Animated.View style={[styles.welcomePitchBg, { transform: [{ scale: welcomePitchScale }] }]}>
            {/* Tactical pitch lines (pure RN, no images needed) */}
            <View style={styles.pitchOuter}>
              <View style={styles.pitchCentreLine} />
              <View style={styles.pitchCentreCircle} />
              <View style={styles.pitchCentreSpot} />
              <View style={styles.pitchPenaltyTop} />
              <View style={styles.pitchPenaltyBottom} />
            </View>
            {/* Dark gradient overlay so text is legible */}
            <LinearGradient
              colors={theme === 'dark'
                ? ['rgba(5,10,30,0.55)', 'rgba(5,10,30,0.92)']
                : ['rgba(240,248,255,0.45)', 'rgba(220,235,255,0.92)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Card */}
          <Animated.View style={[
            styles.welcomeCard,
            theme === 'light' && styles.welcomeCardLight,
            { opacity: welcomeCardOpacity, transform: [{ scale: welcomeScale }] }
          ]}>
            {/* Brand badge */}
            <Animated.View style={[styles.welcomeBadgeRow, { opacity: welcomeH1Fade }]}>
              <View style={styles.welcomeBadgeDot} />
              <Text style={[styles.welcomeBadgeText, theme === 'light' && { color: '#3b82f6' }]}>OMNIPITCH AI  ·  NEXT-GEN ANALYTICS</Text>
            </Animated.View>

            {/* Pitch icon */}
            <Animated.View style={[styles.welcomeIconWrap, { opacity: welcomeH1Fade }]}>
              <Text style={{ fontSize: 48, lineHeight: 56 }}>⚽</Text>
            </Animated.View>

            {/* Headline */}
            <Animated.Text style={[
              styles.welcomeTitle,
              theme === 'light' && styles.welcomeTitleLight,
              { opacity: welcomeH1Fade, transform: [{ translateY: welcomeH1Fade.interpolate({ inputRange: [0,1], outputRange: [12,0] }) }] }
            ]}>
              Welcome to{`\n`}OmniPitch AI
            </Animated.Text>

            {/* Divider */}
            <Animated.View style={[styles.welcomeDivider, { opacity: welcomeSubFade }]} />

            {/* Subtext */}
            <Animated.Text style={[
              styles.welcomeSubtext,
              theme === 'light' && { color: '#334155' },
              { opacity: welcomeSubFade, transform: [{ translateY: welcomeSubFade.interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }
            ]}>
              The next generation of autonomous tactical and physical interventions. We analyze real-time match data to generate dynamic, AI-driven training schedules for your squad.
            </Animated.Text>

            {/* Feature pills */}
            <Animated.View style={[styles.welcomePills, { opacity: welcomeSubFade }]}>
              {['🔬 Anomaly Detection', '📅 Schedule Override', '🤖 AI Interventions'].map((f, i) => (
                <View key={i} style={[styles.welcomePill, theme === 'light' && styles.welcomePillLight]}>
                  <Text style={[styles.welcomePillText, theme === 'light' && { color: '#1e3a5f' }]}>{f}</Text>
                </View>
              ))}
            </Animated.View>

            {/* CTA */}
            <Animated.View style={[{ width: '100%', opacity: welcomeBtnFade, transform: [{ translateY: welcomeBtnFade.interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }]}>
              <TouchableOpacity style={styles.welcomeBtn} onPress={closeWelcome} activeOpacity={0.85}>
                <LinearGradient
                  colors={theme === 'dark' ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.welcomeBtnGradient}
                >
                  <Text style={styles.welcomeBtnText}>Enter the Pitch  →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Global Sync Modal — Glassmorphism (Theme-Aware) */}
      <Modal transparent visible={showSyncModal} animationType="none" statusBarTranslucent>
        <Animated.View style={[styles.syncModalOverlay, { opacity: overlayOpacity }]}>
          <Animated.View style={[
            styles.syncModalContent,
            { opacity: modalOpacity, transform: [{ scale: modalScale }] }
          ]}>
            {/* Glow rings */}
            <View style={styles.syncGlowRing} />

            {/* Icon */}
            <Animated.View style={[styles.syncIconContainer, { transform: [{ scale: iconPulse }] }]}>
              <Text style={{ fontSize: 36 }}>📡</Text>
              <View style={styles.syncIconDot} />
            </Animated.View>

            {/* Eyebrow */}
            <Animated.View style={{ opacity: headlineFade }}>
              <Text style={styles.syncEyebrow}>⚡  OMNIPITCH AI  ·  LIVE SYNC</Text>
            </Animated.View>

            {/* Headline */}
            <Animated.View style={{ opacity: headlineFade }}>
              <Text style={styles.syncModalTitle}>SQUAD DATA{`\n`}SYNCHRONIZED</Text>
            </Animated.View>

            {/* Divider */}
            <Animated.View style={[styles.syncDivider, { opacity: subtextFade }]} />

            {/* Subtext */}
            <Animated.Text style={[styles.syncModalBody, { opacity: subtextFade }]}>
              Live player data and anomaly detection complete. Select an individual player from the squad list to dynamically generate their custom AI intervention schedule.
            </Animated.Text>

            {/* Stats Row */}
            <Animated.View style={[styles.syncStatsRow, { opacity: subtextFade }]}>
              <View style={styles.syncStatChip}>
                <Text style={styles.syncStatValue}>{alertCount}</Text>
                <Text style={styles.syncStatLabel}>ALERTS</Text>
              </View>
              <View style={styles.syncStatChip}>
                <Text style={styles.syncStatValue}>{selectedTeam?.players?.length ?? 0}</Text>
                <Text style={styles.syncStatLabel}>PLAYERS</Text>
              </View>
              <View style={styles.syncStatChip}>
                <Text style={[styles.syncStatValue, { color: '#10b981' }]}>LIVE</Text>
                <Text style={styles.syncStatLabel}>STATUS</Text>
              </View>
            </Animated.View>

            {/* CTA Button */}
            <Animated.View style={[{ width: '100%', opacity: btnFade, transform: [{ translateY: btnFade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
              <TouchableOpacity
                style={styles.syncModalBtn}
                onPress={closeSyncModal}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#3b82f6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.syncModalBtnGradient}
                >
                  <Text style={styles.syncModalBtnText}>Start Analysis →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const createStyles = (colors: any, theme: 'light' | 'dark') => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBase },
  scroll: { flex: 1 },
  teamPills: { gap: 8, paddingBottom: 2 },
  teamPill: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.heroCardBg, borderWidth: 1, borderColor: colors.heroCardBg,
  },
  teamPillActive: { backgroundColor: colors.primary, borderColor: colors.borderFocus },
  teamPillText: { fontSize: 13, fontWeight: '700', color: colors.textSub },
  teamPillTextActive: { color: colors.textInverse },
  sectionLabel: {
    fontSize: 10, fontWeight: '900', color: colors.textMuted,
    marginBottom: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4,
  },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 16, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: colors.borderBase,
  },
  dropdownDetail: {
    backgroundColor: colors.bgDropdown,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  playerBanner: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bigAvatar: {
    width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    marginRight: 14, borderWidth: 2, borderColor: colors.borderBase, backgroundColor: colors.bgCardAlt,
  },
  bigAvatarText: { color: colors.textTitle, fontSize: 20, fontWeight: '900' },
  playerName: { fontSize: 18, fontWeight: '800', color: colors.textTitle, letterSpacing: -0.3 },
  playerMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3, fontWeight: '500' },
  statsRow: { flexDirection: 'row' },
  insightCard: {
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1,
    backgroundColor: theme === 'dark' ? 'rgba(245,158,11,0.07)' : 'rgba(251,191,36,0.08)',
    borderColor: theme === 'dark' ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.3)',
    overflow: 'hidden',
    position: 'relative',
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  insightLabel: { fontSize: 14, fontWeight: '800', flex: 1, letterSpacing: 0.1 },
  confBadge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  confText: { fontSize: 11, fontWeight: '900' },
  insightBody: { fontSize: 13, color: colors.textSub, lineHeight: 21, marginBottom: 12 },
  indicatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  indicator: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  indValue: { fontSize: 13, fontWeight: '800' },
  indLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  appliedCard: {
    backgroundColor: theme === 'dark' ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.05)',
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: theme === 'dark' ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.3)',
    shadowColor: colors.success, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2,
  },
  appliedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  appliedTitle: { fontSize: 14, fontWeight: '800', color: colors.success },
  appliedScenario: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  schedChangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  schedOriginal: {
    flex: 1,
    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.04)',
    borderRadius: 9, padding: 10,
    opacity: 0.5,
  },
  schedStrike: { fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through', fontStyle: 'italic' },
  schedArrow: { fontSize: 18, color: '#6366f1', fontWeight: '900' },
  schedNew: {
    flex: 1.5, flexDirection: 'row',
    backgroundColor: theme === 'dark' ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.8)',
    borderRadius: 9, padding: 10, gap: 8,
    borderWidth: 1, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  schedNewIcon: { fontSize: 16, marginTop: 1 },
  schedNewTitle: { fontSize: 12, fontWeight: '800' },
  schedNewMeta: { fontSize: 10, color: colors.textSub, marginTop: 2 },
  appliedHint: { fontSize: 12, color: colors.textMuted, marginTop: 8, textAlign: 'center' },
  actionBtn: {
    borderRadius: 16, padding: 18, marginBottom: 10, overflow: 'hidden',
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 10,
  },
  actionBtnDone: {
    backgroundColor: colors.bgDropdown, borderWidth: 1, borderColor: colors.borderStrong, shadowOpacity: 0, elevation: 0,
  },
  actionBtnProc: { opacity: 0.85 },
  actionInner: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  actionSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  allGoodCard: {
    flexDirection: 'row', backgroundColor: colors.bgCardAlt, borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: colors.success, alignItems: 'center', gap: 12,
  },
  allGoodText: { fontSize: 14, color: colors.textSub, flex: 1, lineHeight: 22 },
  resetBtn: { alignItems: 'center', padding: 14 },
  resetText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    borderTopWidth: 1, borderColor: colors.borderBase,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, elevation: 30,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.borderStrong, borderRadius: 2, alignSelf: 'center', marginBottom: 22 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  priorBadge: {
    backgroundColor: colors.bgCardAlt, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.danger,
  },
  priorText: { color: colors.danger, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.textTitle, marginBottom: 8, letterSpacing: -0.3 },
  modalBody: { fontSize: 14, color: colors.textSub, lineHeight: 23, marginBottom: 14 },
  modalScheduleNote: { fontSize: 13, color: colors.warning, marginBottom: 16, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: colors.bgCardAlt, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 7, borderWidth: 1, borderColor: colors.borderSubtle },
  chipText: { color: colors.textSub, fontSize: 12, fontWeight: '700' },
  // ── Glassmorphism Sync Modal (Theme-Aware) ──────────────────────────────
  syncModalOverlay: {
    flex: 1,
    backgroundColor: theme === 'dark' ? 'rgba(0,4,18,0.82)' : 'rgba(200,218,240,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  syncModalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme === 'dark' ? 'rgba(10,20,50,0.88)' : 'rgba(255,255,255,0.88)',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme === 'dark' ? 'rgba(99,102,241,0.55)' : 'rgba(59,130,246,0.45)',
    shadowColor: '#6366f1',
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  syncGlowRing: {
    position: 'absolute',
    top: -80,
    left: '50%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: theme === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(59,130,246,0.06)',
    marginLeft: -130,
  },
  syncIconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme === 'dark' ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: theme === 'dark' ? 'rgba(99,102,241,0.4)' : 'rgba(59,130,246,0.35)',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  syncIconDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: theme === 'dark' ? 'rgba(10,20,50,0.88)' : 'rgba(255,255,255,0.9)',
  },
  syncEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: theme === 'dark' ? '#6366f1' : '#3b82f6',
    letterSpacing: 2.5,
    marginBottom: 10,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  syncModalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 34,
    marginBottom: 8,
    textTransform: 'uppercase',
    textShadowColor: theme === 'dark' ? 'rgba(99,102,241,0.6)' : 'rgba(59,130,246,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  syncDivider: {
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme === 'dark' ? '#6366f1' : '#3b82f6',
    marginBottom: 18,
    marginTop: 4,
  },
  syncModalBody: {
    fontSize: 14,
    color: theme === 'dark' ? '#94a3b8' : '#334155',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  syncStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
    width: '100%',
  },
  syncStatChip: {
    flex: 1,
    backgroundColor: theme === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(59,130,246,0.07)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme === 'dark' ? 'rgba(99,102,241,0.25)' : 'rgba(59,130,246,0.22)',
  },
  syncStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme === 'dark' ? '#e2e8f0' : '#0f172a',
    letterSpacing: -0.5,
  },
  syncStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: theme === 'dark' ? '#64748b' : '#94a3b8',
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  syncModalBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  syncModalBtnGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 16,
  },
  syncModalBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Welcome Onboarding Modal ──────────────────────────────────────────────
  welcomeOverlay: {
    flex: 1,
    backgroundColor: theme === 'dark' ? 'rgba(2,6,23,0.97)' : 'rgba(15,40,80,0.97)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomePitchBg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  pitchOuter: {
    ...StyleSheet.absoluteFillObject,
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    margin: 32,
    borderRadius: 4,
  },
  pitchCentreLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.14)',
  },
  pitchCentreCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.14)',
    marginLeft: -60,
    marginTop: -60,
  },
  pitchCentreSpot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.2)',
    marginLeft: -3,
    marginTop: -3,
  },
  pitchPenaltyTop: {
    position: 'absolute',
    top: 0,
    left: '25%',
    width: '50%',
    height: 80,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.14)',
  },
  pitchPenaltyBottom: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    width: '50%',
    height: 80,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.14)',
  },
  welcomeCard: {
    width: '88%',
    maxWidth: 440,
    backgroundColor: theme === 'dark' ? 'rgba(8,16,42,0.90)' : 'rgba(255,255,255,0.90)',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.50)',
    shadowColor: '#22c55e',
    shadowOpacity: 0.35,
    shadowRadius: 48,
    elevation: 30,
    overflow: 'hidden',
  },
  welcomeCardLight: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(22,163,74,0.55)',
  },
  welcomeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 18,
  },
  welcomeBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  welcomeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22c55e',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  welcomeIconWrap: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#f0f9ff',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 42,
    marginBottom: 6,
    textShadowColor: 'rgba(34,197,94,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  welcomeTitleLight: {
    color: '#0f172a',
    textShadowColor: 'rgba(22,163,74,0.25)',
  },
  welcomeDivider: {
    width: 56,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#22c55e',
    marginBottom: 18,
    marginTop: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  welcomePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 28,
    width: '100%',
  },
  welcomePill: {
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  welcomePillLight: {
    backgroundColor: 'rgba(22,163,74,0.08)',
    borderColor: 'rgba(22,163,74,0.25)',
  },
  welcomePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: 0.3,
  },
  welcomeBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  welcomeBtnGradient: {
    paddingVertical: 17,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 16,
  },
  welcomeBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
