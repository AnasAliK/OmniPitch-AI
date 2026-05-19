import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { analyzePlayer, getCategoryColor, type Player, type AnalysisResult, type IssueCategory, type TeamData } from '@/data/team';
import { useApp } from '@/context/AppContext';

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
      const category = analysis.scenario_tab.category;
      if (!categoryMap[category]) categoryMap[category] = [];
      categoryMap[category].push({ player, analysis });
    }
  });

  const icons: Record<string, string> = { Technical: '🎯', Physical: '🏃', Tactical: '🛡️' };

  return Object.entries(categoryMap).map(([cat, players]) => ({
    category: cat as IssueCategory,
    icon: icons[cat] ?? '⚠️',
    players: players.sort((a, b) => b.analysis.scenario_tab.confidence_score - a.analysis.scenario_tab.confidence_score),
  }));
}

// ─── Scenario Card ──────────────────────────────────────────────────────────

function ScenarioCard({ scenario }: { scenario: DiscoveredScenario }) {
  const { colors } = useApp();
  const cardStyles = useMemo(() => createCardStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  const color = getCategoryColor(scenario.category);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Collect unique anomaly titles across all players
  const allAnomalyTypes = [...new Set(
    scenario.players.map(({ analysis }) => analysis?.scenario_tab?.anomaly_title).filter(Boolean)
  )];

  const statusChangeMap: Record<string, string> = {
    Technical: 'Technical Focus',
    Physical: 'Recovery',
    Tactical: 'Tactical Review',
    None: 'Active'
  };

  return (
    <TouchableOpacity
      style={[cardStyles.container, { borderColor: expanded ? color + '60' : colors.borderStrong }]}
      onPress={toggle}
      activeOpacity={0.8}
    >
      <View style={cardStyles.header}>
        <View style={[cardStyles.iconBadge, { backgroundColor: color + '20' }]}>
          <Text style={cardStyles.iconText}>{scenario.icon}</Text>
        </View>
        <View style={cardStyles.headerInfo}>
          <Text style={cardStyles.title}>{scenario.category} Issues</Text>
          <Text style={cardStyles.tagline}>
            Auto-detected from {allAnomalyTypes.length} anomaly type{allAnomalyTypes.length > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={cardStyles.rightCol}>
          <View style={[cardStyles.countBadge, { backgroundColor: '#ef444420' }]}>
            <Text style={[cardStyles.countText, { color: '#ef4444' }]}>
              {scenario.players.length} flagged
            </Text>
          </View>
          <Text style={cardStyles.expand}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </View>

      {expanded && (
        <View style={cardStyles.body}>
          {/* Detected Anomaly Types */}
          <View style={cardStyles.section}>
            <Text style={cardStyles.sectionTitle}>⚡ Detected Anomaly Types</Text>
            <View style={cardStyles.anomalyChips}>
              {allAnomalyTypes.map((type, i) => (
                <View key={i} style={[cardStyles.anomalyChip, { backgroundColor: color + '15' }]}>
                  <Text style={[cardStyles.anomalyChipText, { color }]}>{type}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Players */}
          <View style={cardStyles.section}>
            <Text style={cardStyles.sectionTitle}>🚨 Flagged Players</Text>
            {scenario.players.map(({ player, analysis }) => {
              const confidence = analysis?.scenario_tab?.confidence_score ?? 80;
              const pSeverity = confidence >= 90 ? 'critical' : confidence >= 80 ? 'high' : 'medium';
              const statusChange = statusChangeMap[analysis?.scenario_tab?.category ?? 'None'] || 'Active';
              const primaryDrill = analysis?.interventions?.[0]?.title || 'Dynamic Drill';
              const primaryDuration = analysis?.interventions?.[0]?.duration_mins ? `${analysis?.interventions?.[0]?.duration_mins} mins` : '45 mins';

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
                      <View style={[cardStyles.confBadge, { backgroundColor: sevColor(pSeverity) + '20' }]}>
                        <Text style={[cardStyles.confText, { color: sevColor(pSeverity) }]}>
                          {confidence}%
                        </Text>
                      </View>
                    </View>
                    <Text style={cardStyles.playerReason}>{analysis?.ooda_trace?.orient_summary ?? 'Analyzing...'}</Text>
                    <View style={cardStyles.indRow}>
                      {(analysis?.interventions ?? []).map((inv, i) => (
                        <View key={i} style={[cardStyles.indChip, { backgroundColor: colors.bgDropdown, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, margin: 2 }]}>
                          <Text style={[cardStyles.indText, { color: colors.textTitle, fontSize: 9 }]}>{inv.title} ({inv.duration_mins}m)</Text>
                        </View>
                      ))}
                    </View>
                    <View style={cardStyles.intBlock}>
                      <Text style={cardStyles.intLabel}>Generated Intervention:</Text>
                      <Text style={cardStyles.intValue}>{primaryDrill}</Text>
                      <Text style={cardStyles.intDuration}>
                        {primaryDuration} • → {statusChange}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </TouchableOpacity>
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.heroGrad1, colors.heroGrad2]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEyebrow}>⚡  SCENARIO ENGINE</Text>
          <Text style={styles.heroTitle}>Scenarios</Text>
          <Text style={styles.heroSub}>Auto-detected from performance baselines</Text>
        </LinearGradient>

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
        <TouchableOpacity
          style={[styles.aiBtn, isGenerating && { opacity: 0.7 }]}
          onPress={handleAiDiscovery}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Text style={{ fontSize: 18, marginRight: 8 }}>🧠</Text>
          )}
          <Text style={styles.aiBtnText}>
            {isGenerating ? 'AI Generating Scenarios...' : 'Auto-Discover with AI'}
          </Text>
        </TouchableOpacity>

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
  hero: { paddingTop: Platform.OS === 'android' ? 16 : 12, paddingBottom: 24, paddingHorizontal: 16 },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: colors.heroEyebrow, letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: colors.textTitle, letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: colors.textSub, marginTop: 6 },
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
    backgroundColor: colors.info, borderRadius: 16, padding: 16, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.info, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4,
  },
  aiBtnText: { color: colors.textInverse, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});

const createCardStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.bgDropdown, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
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
  anomalyChip: { borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5 },
  anomalyChipText: { fontSize: 11, fontWeight: '800' },
  playerRow: {
    flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 13, padding: 14,
    marginBottom: 10, alignItems: 'flex-start',
    borderWidth: 1, borderColor: colors.borderBase,
  },
  playerAvatar: {
    width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center',
    marginRight: 12, marginTop: 2, borderWidth: 1.5, borderColor: 'transparent',
    overflow: 'hidden',
  },
  playerInit: { fontSize: 13, fontWeight: '900' },
  playerInfo: { flex: 1 },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  playerName: { fontSize: 14, fontWeight: '800', color: colors.textTitle },
  playerReason: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: 8 },
  indRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  indChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  indText: { fontSize: 10, fontWeight: '800' },
  intBlock: { backgroundColor: colors.bgCardAlt, borderRadius: 9, padding: 10, borderWidth: 1, borderColor: colors.borderBase },
  intLabel: { fontSize: 9, fontWeight: '800', color: colors.textSub, marginBottom: 3, letterSpacing: 0.8, textTransform: 'uppercase' },
  intValue: { fontSize: 13, fontWeight: '700', color: colors.textTitle },
  intDuration: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  confBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  confText: { fontSize: 11, fontWeight: '900' },
});
