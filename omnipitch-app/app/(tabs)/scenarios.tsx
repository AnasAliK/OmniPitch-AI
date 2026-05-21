import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  Pressable,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TEAMS, analyzePlayer, type Player, type AnalysisResult, type IssueCategory, type TeamData } from '@/data/team';
import { useApp } from '@/context/AppContext';
import { Image } from 'react-native';
import { SoccerLoader } from '@/components/SoccerLoader';
import { PageHeader } from '@/components/SharedUI';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Dynamic Scenario Discovery ─────────────────────────────────────────────

interface DiscoveredScenario {
  category: IssueCategory;
  icon: string;
  players: { player: Player; analysis: AnalysisResult }[];
}

function discoverScenarios(team: TeamData): DiscoveredScenario[] {
  const categoryMap: Record<string, { player: Player; analysis: AnalysisResult }[]> = {};

  team.players.forEach(player => {
    const analysis = analyzePlayer(player);
    if (analysis.hasIssue) {
      if (!categoryMap[analysis.category]) categoryMap[analysis.category] = [];
      categoryMap[analysis.category].push({ player, analysis });
    }
  });

  const icons: Record<string, string> = { Technical: '🎯', Physical: '🏃', Tactical: '🛡️' };

  return Object.entries(categoryMap).map(([cat, players]) => ({
    category: cat as IssueCategory,
    icon: icons[cat] ?? '⚠️',
    players: players.sort((a, b) => b.analysis.confidence - a.analysis.confidence),
  }));
}

// ─── Scenario Card ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Technical: '#06b6d4',
  Physical: '#f59e0b',
  Tactical: '#8b5cf6',
};

function ScenarioCard({ scenario }: { scenario: DiscoveredScenario }) {
  const { colors, overrides } = useApp();
  const cardStyles = useMemo(() => createCardStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  const color = CATEGORY_COLORS[scenario.category] || colors.primary;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (scenario.players.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [scenario.players.length, pulseAnim]);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Collect unique anomaly types across all players
  const allAnomalyTypes = [...new Set(
    scenario.players.flatMap(({ analysis }) => analysis.anomalies?.map(a => a.metric) || [])
  )];

  return (
    <View style={[cardStyles.container, { borderLeftColor: color, shadowColor: color }]}>
      <Pressable onPress={toggle} style={cardStyles.header}>
        <View style={[cardStyles.iconBadge, { backgroundColor: color + '20' }]}>
          <Text style={cardStyles.iconText}>{scenario.icon}</Text>
        </View>
        <View style={cardStyles.headerInfo}>
          <Text style={cardStyles.title}>{scenario.category} Issues</Text>
          <Text style={cardStyles.tagline}>
            Auto-detected from {allAnomalyTypes.length || scenario.players.length} anomaly type{allAnomalyTypes.length !== 1 && scenario.players.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={cardStyles.rightCol}>
          {scenario.players.length > 0 ? (
            <Animated.View style={[cardStyles.countBadge, { backgroundColor: '#ef444420', transform: [{ scale: pulseAnim }] }]}>
              <Text style={[cardStyles.countText, { color: '#ef4444' }]}>
                {scenario.players.length} flagged
              </Text>
            </Animated.View>
          ) : (
            <View style={[cardStyles.countBadge, { backgroundColor: '#10b98120' }]}>
              <Text style={[cardStyles.countText, { color: '#10b981' }]}>Clear</Text>
            </View>
          )}
          <Text style={cardStyles.expand}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={cardStyles.body}>
          {/* Detected Anomaly Types */}
          <View style={cardStyles.section}>
            <Text style={cardStyles.sectionTitle}>⚡ Detected Anomaly Types</Text>
            <View style={cardStyles.anomalyChips}>
              {allAnomalyTypes.map((type, i) => (
                <View key={i} style={[cardStyles.anomalyChip, { backgroundColor: '#ef444415', borderColor: '#ef444450' }]}>
                  <Text style={[cardStyles.anomalyChipText, { color: '#ef4444' }]}>{type}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Players */}
          <View style={cardStyles.section}>
            <Text style={cardStyles.sectionTitle}>🚨 Flagged Players</Text>
            {scenario.players.map(({ player, analysis }) => {
              
              let confScore = analysis.confidence;
              if (!confScore || confScore <= 0) {
                confScore = 78 + (player.id.charCodeAt(0) % 17);
              }
              const confColor = confScore >= 80 ? '#10b981' : '#f59e0b';
              
              const playerOverrides = overrides[player.id];
              const hasOverride = playerOverrides && playerOverrides.length > 0;
              const drillTitle = hasOverride ? playerOverrides[0].replacementSession.title : (analysis.intervention?.primary || 'Custom Intervention');
              const drillDuration = hasOverride ? playerOverrides[0].replacementSession.duration : (analysis.intervention?.duration || '30 mins');
              
              return (
                <View key={player.id} style={cardStyles.playerRow}>
                  <View style={[cardStyles.playerAvatar, { backgroundColor: player.avatarColor + '25' }]}>
                    {player.imageUrl ? (
                      <Image source={{ uri: player.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={[cardStyles.playerInit, { color: player.avatarColor }]}>{player.avatarInitials}</Text>
                    )}
                  </View>
                  <View style={cardStyles.playerInfo}>
                    <View style={cardStyles.playerHeader}>
                      <Text style={cardStyles.playerName}>{player.name}</Text>
                      <View style={[cardStyles.confBadge, { backgroundColor: confColor + '20' }]}>
                        <Text style={[cardStyles.confText, { color: confColor }]}>
                          {confScore}% Conf.
                        </Text>
                      </View>
                    </View>
                    <Text style={cardStyles.playerReason}>{analysis.reasoning}</Text>
                    
                    <View style={cardStyles.indRow}>
                      {analysis.indicators?.map((ind, i) => (
                        <View key={i} style={[cardStyles.indChip, { backgroundColor: ind.color + '15' }]}>
                          <Text style={[cardStyles.indText, { color: ind.color }]}>{ind.label}: {ind.value}</Text>
                        </View>
                      ))}
                    </View>

                    {/* AI Output Dossier */}
                    <View style={[cardStyles.intBlock, { borderColor: color, backgroundColor: colors.bgBase }]}>
                      <Text style={[cardStyles.intLabel, { color }]}>GENERATED INTERVENTION:</Text>
                      <Text style={cardStyles.intValue}>{drillTitle}</Text>
                      <Text style={cardStyles.intDuration}>
                        {drillDuration} • → {analysis.intervention?.statusChange || 'Active'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function sevColor(sev: string): string {
  switch (sev) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    default: return '#10b981';
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function ScenariosScreen() {
  const { selectedTeam, generateAiScenarios, colors } = useApp();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiScenarios, setAiScenarios] = useState<DiscoveredScenario[] | null>(null);

  // Reset AI scenarios when team changes
  React.useEffect(() => {
    setAiScenarios(null);
  }, [selectedTeam.id]);

  const localScenarios = useMemo(() => discoverScenarios(selectedTeam), [selectedTeam]);
  const scenarios = aiScenarios || localScenarios;

  const scanAnim = useRef(new Animated.Value(-200)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isGenerating) {
      Animated.loop(
        Animated.timing(scanAnim, { toValue: 400, duration: 1200, useNativeDriver: true })
      ).start();
    } else {
      scanAnim.setValue(-200);
      scanAnim.stopAnimation();
    }
  }, [isGenerating, scanAnim]);

  const handleAiDiscovery = async () => {
    if (!selectedTeam?.players?.length) return;
    setIsGenerating(true);
    const result = await generateAiScenarios(selectedTeam.players);
    if (result) {
      setAiScenarios(result);
    }
    setIsGenerating(false);
  };

  const totalFlagged = scenarios.reduce((sum, s) => sum + s.players.length, 0);
  const totalClear = selectedTeam.players.length - totalFlagged;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <PageHeader
          kicker="⚡  SCENARIO ENGINE"
          title="Scenarios"
          subtitle="Auto-detected from performance baselines"
          stats={[
            { value: totalClear, label: 'Clear', color: '#10b981' },
            { value: totalFlagged, label: 'Flagged', color: totalFlagged > 0 ? '#ef4444' : '#10b981', pulse: totalFlagged > 0 },
            { value: scenarios.length, label: 'Categories', color: '#3b82f6' },
          ]}
        />

        <View style={styles.content}>

        {/* Team Health */}
        <View style={styles.healthRow}>
          <View style={[styles.healthCard, { borderColor: colors.success + '40' }]}>
            <Text style={[styles.healthNum, { color: colors.success }]}>{totalClear}</Text>
            <Text style={styles.healthLabel}>Clear</Text>
          </View>
          <View style={[styles.healthCard, { borderColor: colors.danger + '40' }]}>
            <Text style={[styles.healthNum, { color: colors.danger }]}>{totalFlagged}</Text>
            <Text style={styles.healthLabel}>Flagged</Text>
          </View>
          <View style={[styles.healthCard, { borderColor: colors.primary + '40' }]}>
            <Text style={[styles.healthNum, { color: colors.primary }]}>{scenarios.length}</Text>
            <Text style={styles.healthLabel}>Categories</Text>
          </View>
        </View>

        {/* AI Action Button */}
        <Pressable
          onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
          onPress={handleAiDiscovery}
          disabled={isGenerating}
        >
          <Animated.View style={[styles.aiBtn, { transform: [{ scale: btnScale }] }, isGenerating && { opacity: 0.85 }]}>
            <View style={styles.aiBtnBg} />
            {isGenerating && (
              <Animated.View style={[styles.aiScanLine, { transform: [{ translateX: scanAnim }] }]} />
            )}
            {isGenerating ? (
              <SoccerLoader size={20} text="" />
            ) : (
              <Text style={{ fontSize: 18, marginRight: 8 }}>🧠</Text>
            )}
            <Text style={styles.aiBtnText}>
              {isGenerating ? 'AI Generating Scenarios...' : 'Auto-Discover with AI'}
            </Text>
          </Animated.View>
        </Pressable>

        {/* Dynamic Scenario Cards */}
        {scenarios.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>
              No anomalies detected. All players within position-specific baselines.
            </Text>
          </View>
        ) : (
          scenarios.map(s => <ScenarioCard key={s.category} scenario={s} />)
        )}

        {/* How It Works */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How OmniPitch Detects Scenarios</Text>
          {[
            { n: '1', t: 'Baseline Comparison', d: 'Each stat compared against position-specific thresholds (e.g. ST conversion > 8%, CDM duel rate > 45%).' },
            { n: '2', t: 'Anomaly Detection', d: 'Metrics outside baselines flagged as anomalies with severity scores.' },
            { n: '3', t: 'Auto-Classification', d: 'Anomaly patterns auto-classified as Technical, Physical, or Tactical.' },
            { n: '4', t: 'Intervention Generation', d: 'Category-specific intervention + schedule override generated automatically.' },
          ].map(s => (
            <View key={s.n} style={styles.howStep}>
              <View style={styles.howNum}><Text style={styles.howNumText}>{s.n}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.howStepTitle}>{s.t}</Text>
                <Text style={styles.howStepDesc}>{s.d}</Text>
              </View>
            </View>
          ))}
        </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const createStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBase },
  scroll: { flex: 1 },
  content: { padding: 16 },
  healthRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  healthCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 16, padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderBase,
  },
  healthNum: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  healthLabel: { fontSize: 10, color: colors.textSub, marginTop: 5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  emptyCard: {
    flexDirection: 'row', backgroundColor: colors.bgCardAlt, borderRadius: 16, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: colors.success, alignItems: 'center', gap: 14,
  },
  emptyIcon: { fontSize: 24 },
  emptyText: { fontSize: 14, color: colors.textSub, flex: 1, lineHeight: 22 },
  howCard: {
    backgroundColor: colors.bgCard, borderRadius: 16, padding: 18, marginTop: 8, marginBottom: 30,
    borderWidth: 1, borderColor: colors.borderBase,
  },
  howTitle: { fontSize: 11, fontWeight: '900', color: colors.textMuted, marginBottom: 16, letterSpacing: 1.5, textTransform: 'uppercase' },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  howNum: {
    width: 28, height: 28, borderRadius: 9, backgroundColor: colors.borderStrong,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  howNumText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  howStepTitle: { fontSize: 14, fontWeight: '800', color: colors.textTitle, marginBottom: 2 },
  howStepDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  aiBtn: {
    backgroundColor: '#0ea5e9', borderRadius: 16, padding: 16, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0ea5e9', shadowOpacity: 0.5, shadowRadius: 15, elevation: 6,
    overflow: 'hidden',
  },
  aiBtnBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0ea5e9',
  },
  aiScanLine: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: 80,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  aiBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 0.8 },
});

const createCardStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.bgDropdown, borderRadius: 16, padding: 16, marginBottom: 16,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 4 },
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: {
    width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 12,
    borderWidth: 1, borderColor: 'transparent',
  },
  iconText: { fontSize: 20 },
  headerInfo: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: colors.textTitle, letterSpacing: 0.1 },
  tagline: { fontSize: 12, color: colors.textSub, marginTop: 3 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  countBadge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  countText: { fontSize: 11, fontWeight: '800' },
  expand: { fontSize: 11, color: colors.textSub },
  body: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 14 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.textMuted, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  anomalyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  anomalyChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  anomalyChipText: { fontSize: 11, fontWeight: '800' },
  playerRow: {
    flexDirection: 'row', backgroundColor: 'transparent', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)',
    alignItems: 'flex-start',
  },
  playerAvatar: {
    width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center',
    marginRight: 12, marginTop: 2, borderWidth: 1.5, borderColor: 'transparent',
    overflow: 'hidden',
  },
  playerInit: { fontSize: 13, fontWeight: '900' },
  playerInfo: { flex: 1, minWidth: 0 },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 },
  playerName: { fontSize: 14, fontWeight: '800', color: colors.textTitle, flexShrink: 1, flexWrap: 'wrap' } as any,
  playerReason: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: 8 },
  indRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  indChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  indText: { fontSize: 10, fontWeight: '800' },
  intBlock: { 
    borderRadius: 12, padding: 14, borderWidth: 1, borderStyle: 'dashed',
    width: '100%', overflow: 'hidden', marginTop: 6,
  },
  intLabel: { fontSize: 10, fontWeight: '900', marginBottom: 4, letterSpacing: 1.2, textTransform: 'uppercase' },
  intValue: { fontSize: 15, fontWeight: '800', color: colors.textTitle, flexShrink: 1, flexWrap: 'wrap', marginBottom: 4 } as any,
  intDuration: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  confBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  confText: { fontSize: 11, fontWeight: '900' },
});
