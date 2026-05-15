import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { TEAMS, analyzePlayer, getPositionColor, getCategoryColor, type Player, type AnalysisResult } from '@/data/team';
import { useApp } from '@/context/AppContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Dynamic Agent Trace for a selected player ─────────────────────────────

function buildTraceSteps(player: Player, analysis: AnalysisResult) {
  const s = player.stats;
  const duelRate = s.groundDuelsTotal > 0 ? ((s.groundDuelsWon / s.groundDuelsTotal) * 100).toFixed(0) : '0';
  const convRate = s.shotsTotal > 0 ? ((s.goals / s.shotsTotal) * 100).toFixed(1) : '0';

  // Build Orient content dynamically from anomalies
  let orientContent: string;
  if (!analysis.hasIssue) {
    orientContent = `Reasoning Chain:

1. All stats within expected baselines for ${player.position}.
2. No significant anomalies detected.
3. Heatmap: ${s.heatmapCoverage}, Sprint: ${s.sprintDistance}
4. Duel win rate: ${duelRate}% — acceptable.

Conclusion: No anomaly detected.
Confidence: N/A`;
  } else {
    const anomalyLines = analysis.anomalies.map((a, i) =>
      `${i + 1}. ${a.metric}: ${a.actual}\n   → Baseline: ${a.baseline}\n   → Deviation: ${a.deviation} (severity: ${(a.severity * 100).toFixed(0)}%)`
    ).join('\n\n');

    orientContent = `Anomaly Detection (${analysis.anomalies.length} found):

${anomalyLines}

Classification: ${analysis.category.toUpperCase()} issue
Confidence: ${analysis.confidence}%
Auto-generated from position-specific baseline comparison.`;
  }

  return [
    {
      id: 'observe',
      phase: 'Step 1',
      title: 'OBSERVE',
      subtitle: 'Data Ingestion',
      icon: '📡',
      color: '#3b82f6',
      content: `Tool Call: fetch_player_performance("${player.name}", ${s.matchCount})

Response:
{
  "player_name": "${player.name}",
  "position": "${player.position}",
  "match_count": ${s.matchCount},
  "minutes_played": ${s.minutesPlayed},
  "goals": ${s.goals},
  "xG": ${s.xG},
  "xA": ${s.xA},
  "shots_total": ${s.shotsTotal},
  "shots_on_target": ${s.shotsOnTarget},
  "ground_duels": "${s.groundDuelsWon}/${s.groundDuelsTotal} (${duelRate}%)",
  "passing_accuracy": ${s.passingAccuracy}%,
  "heatmap_coverage": "${s.heatmapCoverage}",
  "sprint_distance": "${s.sprintDistance}"${s.savePercentage !== undefined ? `,
  "save_percentage": ${s.savePercentage}%,
  "goals_conceded": ${s.goalsConceded},
  "counter_goals": ${s.counterGoalsConceded}` : ''}
}`,
    },
    {
      id: 'orient',
      phase: 'Step 2',
      title: 'ORIENT',
      subtitle: 'Anomaly Detection & Classification',
      icon: '🧠',
      color: '#8b5cf6',
      content: orientContent,
    },
    {
      id: 'decide',
      phase: 'Step 3',
      title: 'DECIDE',
      subtitle: 'Intervention Selection',
      icon: '⚡',
      color: '#f59e0b',
      content: !analysis.hasIssue
        ? `No anomalies detected.

All monitored indicators within baselines:
  ✓ Performance metrics normal
  ✓ Physical output acceptable
  ✓ No tactical concerns

Action: Continue current training program.`
        : `Issue Detected: "${analysis.title}"
Category: ${analysis.category}

Anomalies: ${analysis.indicators.map(i => `\n  ${i.color === '#10b981' ? '✓' : '⚠'} ${i.label}: ${i.value}`).join('')}

Generated Intervention:
  • Primary: ${analysis.intervention.primary}
  • Secondary: ${analysis.intervention.secondary}
  • Duration: ${analysis.intervention.duration}
  • Status Change: ${player.status} → ${analysis.intervention.statusChange}`,
    },
    {
      id: 'act',
      phase: 'Step 4',
      title: 'ACT',
      subtitle: 'System State Change',
      icon: '🚀',
      color: '#10b981',
      content: !analysis.hasIssue
        ? `No state change required.
Player remains in current program.`
        : `Tool Call: simulate_system_state_change({
  player_id: "${player.id}",
  player_name: "${player.name}",
  updates: {
    status: "${player.status}" → "${analysis.intervention.statusChange}",
    training: "${analysis.intervention.primary}",
    schedule_override: true,
    notification: {
      recipients: ["Head Coach", "${player.shortName}"],
      priority: "high"
    }
  }
})

Result: ✓ Database updated
        ✓ Notifications dispatched
        ✓ Schedule rewritten for ${analysis.intervention.duration}`,
    },
  ];
}

// ─── Trace Step Component ───────────────────────────────────────────────────

function TraceStep({ step, isLast }: { step: ReturnType<typeof buildTraceSteps>[0]; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={traceStyles.stepContainer}>
      <View style={traceStyles.timelineCol}>
        <View style={[traceStyles.dot, { backgroundColor: step.color }]}>
          <Text style={traceStyles.dotEmoji}>{step.icon}</Text>
        </View>
        {!isLast && <View style={[traceStyles.line, { backgroundColor: step.color + '40' }]} />}
      </View>
      <TouchableOpacity style={traceStyles.contentCard} onPress={toggle} activeOpacity={0.7}>
        <View style={traceStyles.cardHeader}>
          <View>
            <Text style={[traceStyles.phase, { color: step.color }]}>{step.phase}</Text>
            <Text style={traceStyles.stepTitle}>{step.title}</Text>
            <Text style={traceStyles.stepSub}>{step.subtitle}</Text>
          </View>
          <Text style={traceStyles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>
        {expanded && (
          <View style={traceStyles.codeBlock}>
            <Text style={traceStyles.codeText}>{step.content}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function AgentTraceScreen() {
  const { selectedTeam } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // If a team switch happened and the old selectedId isn't in the new team, default to the first player
  const selectedPlayer = selectedTeam.players.find(p => p.id === selectedId) ?? selectedTeam.players[0];
  
  // Keep state in sync with the current team selection
  if (selectedId !== selectedPlayer.id) {
    setSelectedId(selectedPlayer.id);
  }

  const analysis = analyzePlayer(selectedPlayer);
  const steps = buildTraceSteps(selectedPlayer, analysis);

  const flaggedPlayers = selectedTeam.players.filter(p => analyzePlayer(p).hasIssue);
  const allPlayers = selectedTeam.players;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#112060', '#071428']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEyebrow}>🧠  OODA LOOP</Text>
          <Text style={styles.heroTitle}>Agent Trace</Text>
          <Text style={styles.heroSub}>Dynamic Performance Analysis</Text>
        </LinearGradient>

        <View style={styles.content}>

        {/* Player Selector */}
        <Text style={styles.sectionLabel}>Select Player</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
          {allPlayers.map(p => {
            const a = analyzePlayer(p);
            const isSelected = p.id === selectedId;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.selectorChip, isSelected && styles.selectorChipActive]}
                onPress={() => setSelectedId(p.id)}
              >
                <Text style={[styles.selectorText, isSelected && styles.selectorTextActive]}>
                  {p.shortName}
                </Text>
                {a.hasIssue && <View style={styles.selectorDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Subject</Text>
            <Text style={styles.sumValue}>{selectedPlayer.name} (#{selectedPlayer.number})</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Scenario</Text>
            <View style={[styles.scenBadge, { backgroundColor: analysis.hasIssue ? '#f59e0b20' : '#10b98120' }]}>
              <Text style={[styles.scenText, { color: analysis.hasIssue ? '#fbbf24' : '#10b981' }]}>
                {analysis.title}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Confidence</Text>
            <Text style={[styles.sumValue, { color: analysis.confidence >= 80 ? '#10b981' : '#f59e0b' }]}>
              {analysis.confidence > 0 ? `${analysis.confidence}%` : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <Text style={styles.sectionLabel}>Execution Timeline</Text>
        <Text style={styles.hint}>Tap each step to expand</Text>
        {steps.map((step, i) => (
          <TraceStep key={step.id + selectedId} step={step} isLast={i === steps.length - 1} />
        ))}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050c18' },
  scroll: { flex: 1 },
  hero: { paddingTop: Platform.OS === 'android' ? 16 : 12, paddingBottom: 22, paddingHorizontal: 16 },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: '#3b6cc0', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#e8f0ff', letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: '#4a6fa5', marginTop: 6 },
  content: { padding: 16 },
  sectionLabel: {
    fontSize: 10, fontWeight: '900', color: '#2d4a6e',
    marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  hint: { fontSize: 12, color: '#1a2d48', marginBottom: 16 },
  selectorScroll: { marginBottom: 20, marginHorizontal: -4 },
  selectorChip: {
    backgroundColor: '#08142a', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9,
    marginHorizontal: 4, borderWidth: 1, borderColor: '#0f2040',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  selectorChipActive: { backgroundColor: '#1e4db7', borderColor: '#3b82f6' },
  selectorText: { fontSize: 13, color: '#2d4a6e', fontWeight: '700' },
  selectorTextActive: { color: '#fff' },
  selectorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f87171' },
  summaryCard: {
    backgroundColor: '#08142a', borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#0f2040',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  divider: { height: 1, backgroundColor: '#0f2040' },
  sumLabel: { fontSize: 13, color: '#2d4a6e', fontWeight: '600' },
  sumValue: { fontSize: 14, color: '#c8d8f0', fontWeight: '800' },
  scenBadge: { borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'transparent' },
  scenText: { fontSize: 12, fontWeight: '800' },
});

const traceStyles = StyleSheet.create({
  stepContainer: { flexDirection: 'row', marginBottom: 0 },
  timelineCol: { width: 46, alignItems: 'center' },
  dot: {
    width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  dotEmoji: { fontSize: 17 },
  line: { width: 2, flex: 1, marginVertical: 4, borderRadius: 1 },
  contentCard: {
    flex: 1, backgroundColor: '#0d1826', borderRadius: 14, padding: 14, marginLeft: 10, marginBottom: 14,
    borderWidth: 1, borderColor: '#1a2840',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  phase: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 2 },
  stepTitle: { fontSize: 16, fontWeight: '900', color: '#dde8fb', letterSpacing: -0.3 },
  stepSub: { fontSize: 11, color: '#3d5068', marginTop: 3, fontWeight: '600' },
  expandIcon: { fontSize: 11, color: '#3d5068', marginTop: 4 },
  codeBlock: {
    backgroundColor: '#080d16', borderRadius: 10, padding: 13, marginTop: 12,
    borderWidth: 1, borderColor: '#1a2840',
  },
  codeText: {
    fontSize: 11, color: '#7a90b0', lineHeight: 19,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
