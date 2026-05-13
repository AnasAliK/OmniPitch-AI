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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TEAMS, analyzePlayer, getCategoryColor, type Player, type AnalysisResult, type IssueCategory, type TeamData } from '@/data/team';
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

function ScenarioCard({ scenario }: { scenario: DiscoveredScenario }) {
  const [expanded, setExpanded] = useState(false);
  const color = getCategoryColor(scenario.category);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Collect unique anomaly types across all players
  const allAnomalyTypes = [...new Set(
    scenario.players.flatMap(({ analysis }) => analysis.anomalies.map(a => a.metric))
  )];

  return (
    <TouchableOpacity
      style={[cardStyles.container, { borderColor: expanded ? color + '60' : '#334155' }]}
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
            {scenario.players.map(({ player, analysis }) => (
              <View key={player.id} style={cardStyles.playerRow}>
                <View style={[cardStyles.playerAvatar, { backgroundColor: player.avatarColor + '25' }]}>
                  <Text style={[cardStyles.playerInit, { color: player.avatarColor }]}>{player.avatarInitials}</Text>
                </View>
                <View style={cardStyles.playerInfo}>
                  <View style={cardStyles.playerHeader}>
                    <Text style={cardStyles.playerName}>{player.name}</Text>
                    <View style={[cardStyles.confBadge, { backgroundColor: sevColor(analysis.severity) + '20' }]}>
                      <Text style={[cardStyles.confText, { color: sevColor(analysis.severity) }]}>
                        {analysis.confidence}%
                      </Text>
                    </View>
                  </View>
                  <Text style={cardStyles.playerReason}>{analysis.reasoning}</Text>
                  <View style={cardStyles.indRow}>
                    {analysis.indicators.map((ind, i) => (
                      <View key={i} style={[cardStyles.indChip, { backgroundColor: ind.color + '15' }]}>
                        <Text style={[cardStyles.indText, { color: ind.color }]}>{ind.label}: {ind.value}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={cardStyles.intBlock}>
                    <Text style={cardStyles.intLabel}>Generated Intervention:</Text>
                    <Text style={cardStyles.intValue}>{analysis.intervention.primary}</Text>
                    <Text style={cardStyles.intDuration}>
                      {analysis.intervention.duration} • → {analysis.intervention.statusChange}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
  const { selectedTeam } = useApp();
  const scenarios = useMemo(() => discoverScenarios(selectedTeam), [selectedTeam]);
  const totalFlagged = scenarios.reduce((sum, s) => sum + s.players.length, 0);
  const totalClear = selectedTeam.players.length - totalFlagged;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scenarios</Text>
          <Text style={styles.headerSub}>Auto-detected from performance baselines</Text>
        </View>

        {/* Team Health */}
        <View style={styles.healthRow}>
          <View style={[styles.healthCard, { borderColor: '#10b98130' }]}>
            <Text style={[styles.healthNum, { color: '#10b981' }]}>{totalClear}</Text>
            <Text style={styles.healthLabel}>Clear</Text>
          </View>
          <View style={[styles.healthCard, { borderColor: '#ef444430' }]}>
            <Text style={[styles.healthNum, { color: '#ef4444' }]}>{totalFlagged}</Text>
            <Text style={styles.healthLabel}>Flagged</Text>
          </View>
          <View style={[styles.healthCard, { borderColor: '#3b82f630' }]}>
            <Text style={[styles.healthNum, { color: '#3b82f6' }]}>{scenarios.length}</Text>
            <Text style={styles.healthLabel}>Categories</Text>
          </View>
        </View>

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

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flex: 1, padding: 16 },
  header: { marginBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 0 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  healthRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  healthCard: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1,
  },
  healthNum: { fontSize: 28, fontWeight: '800' },
  healthLabel: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },
  emptyCard: {
    flexDirection: 'row', backgroundColor: '#10b98110', borderRadius: 14, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#10b98125', alignItems: 'center', gap: 14,
  },
  emptyIcon: { fontSize: 24 },
  emptyText: { fontSize: 14, color: '#94a3b8', flex: 1, lineHeight: 22 },
  howCard: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 18, marginTop: 8,
    borderWidth: 1, borderColor: '#334155',
  },
  howTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 16 },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  howNum: {
    width: 26, height: 26, borderRadius: 8, backgroundColor: '#3b82f620',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  howNumText: { color: '#3b82f6', fontSize: 13, fontWeight: '800' },
  howStepTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0', marginBottom: 2 },
  howStepDesc: { fontSize: 13, color: '#64748b', lineHeight: 20 },
});

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: {
    width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  iconText: { fontSize: 20 },
  headerInfo: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  tagline: { fontSize: 12, color: '#64748b', marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  countBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  countText: { fontSize: 11, fontWeight: '700' },
  expand: { fontSize: 11, color: '#475569' },
  body: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 10 },
  anomalyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  anomalyChip: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  anomalyChipText: { fontSize: 11, fontWeight: '700' },
  playerRow: {
    flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, padding: 14,
    marginBottom: 10, alignItems: 'flex-start',
  },
  playerAvatar: {
    width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    marginRight: 12, marginTop: 2,
  },
  playerInit: { fontSize: 13, fontWeight: '800' },
  playerInfo: { flex: 1 },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  playerName: { fontSize: 14, fontWeight: '700', color: '#e2e8f0' },
  playerReason: { fontSize: 12, color: '#94a3b8', lineHeight: 18, marginBottom: 8 },
  indRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  indChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  indText: { fontSize: 10, fontWeight: '700' },
  intBlock: { backgroundColor: '#1e293b', borderRadius: 8, padding: 10 },
  intLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', marginBottom: 2 },
  intValue: { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
  intDuration: { fontSize: 11, color: '#475569', marginTop: 2 },
  confBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  confText: { fontSize: 11, fontWeight: '800' },
});
