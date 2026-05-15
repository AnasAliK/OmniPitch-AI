import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TeamData, Player, analyzePlayer, getBaseline, getCategoryColor } from '@/data/team';

// ─── Team Performance Summary ───────────────────────────────────────────────

export function TeamPerformanceSummary({ team }: { team: TeamData }) {
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
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;

    const analysis = analyzePlayer(p);
    if (analysis.hasIssue) {
      let group: 'ATT' | 'MID' | 'DEF' | 'GK';
      if (['ST', 'LW', 'RW', 'CAM'].includes(p.position)) group = 'ATT';
      else if (['CM', 'CDM'].includes(p.position)) group = 'MID';
      else if (['CB', 'LB', 'RB'].includes(p.position)) group = 'DEF';
      else group = 'GK';

      if (analysis.category !== 'None') {
        alertGrid[group][analysis.category]++;
      }
    }
  });

  const totalPlayers = team.players.length || 1; // prevent div by 0
  const activePct = (statusCounts.Active / totalPlayers) * 100;
  const recoveryPct = (statusCounts.Recovery / totalPlayers) * 100;
  const focusPct = ((statusCounts['Technical Focus'] + statusCounts['Tactical Review']) / totalPlayers) * 100;

  const maxGoalsXg = Math.max(totalGoals, totalXG, 1);

  return (
    <View style={teamStyles.container}>
      <Text style={teamStyles.title}>Squad Performance Analytics</Text>

      {/* xG vs Goals */}
      <View style={teamStyles.chartRow}>
        <View style={teamStyles.chartLabelCol}>
          <Text style={teamStyles.chartLabel}>Goals</Text>
          <Text style={teamStyles.chartValue}>{totalGoals}</Text>
        </View>
        <View style={teamStyles.barContainer}>
          <View style={[teamStyles.barFill, { backgroundColor: '#3b82f6', width: `${(totalGoals / maxGoalsXg) * 100}%` }]} />
        </View>
      </View>
      <View style={teamStyles.chartRow}>
        <View style={teamStyles.chartLabelCol}>
          <Text style={teamStyles.chartLabel}>Exp. Goals (xG)</Text>
          <Text style={teamStyles.chartValue}>{totalXG.toFixed(1)}</Text>
        </View>
        <View style={teamStyles.barContainer}>
          <View style={[teamStyles.barFill, { backgroundColor: '#f59e0b', width: `${(totalXG / maxGoalsXg) * 100}%` }]} />
        </View>
      </View>

      {/* Squad Readiness Bar */}
      <Text style={teamStyles.sectionTitle}>Squad Readiness</Text>
      <View style={teamStyles.stackedBarContainer}>
        <View style={[teamStyles.stackedSegment, { backgroundColor: '#10b981', width: `${activePct}%` }]} />
        <View style={[teamStyles.stackedSegment, { backgroundColor: '#8b5cf6', width: `${recoveryPct}%` }]} />
        <View style={[teamStyles.stackedSegment, { backgroundColor: '#f59e0b', width: `${focusPct}%` }]} />
      </View>
      <View style={teamStyles.legendRow}>
        <View style={teamStyles.legendItem}><View style={[teamStyles.legendDot, { backgroundColor: '#10b981' }]} /><Text style={teamStyles.legendText}>Active ({statusCounts.Active})</Text></View>
        <View style={teamStyles.legendItem}><View style={[teamStyles.legendDot, { backgroundColor: '#8b5cf6' }]} /><Text style={teamStyles.legendText}>Recovery ({statusCounts.Recovery})</Text></View>
        <View style={teamStyles.legendItem}><View style={[teamStyles.legendDot, { backgroundColor: '#f59e0b' }]} /><Text style={teamStyles.legendText}>Focus ({statusCounts['Technical Focus'] + statusCounts['Tactical Review']})</Text></View>
      </View>

      {/* Alert Matrix */}
      <Text style={teamStyles.sectionTitle}>Alert Matrix</Text>
      <View style={teamStyles.matrix}>
        <View style={teamStyles.matrixHeaderRow}>
          <Text style={teamStyles.matrixHeaderCell}></Text>
          <Text style={teamStyles.matrixHeaderCell}>Tech</Text>
          <Text style={teamStyles.matrixHeaderCell}>Phys</Text>
          <Text style={teamStyles.matrixHeaderCell}>Tac</Text>
        </View>
        {['ATT', 'MID', 'DEF', 'GK'].map(group => (
          <View key={group} style={teamStyles.matrixRow}>
            <Text style={teamStyles.matrixRowLabel}>{group}</Text>
            {['Technical', 'Physical', 'Tactical'].map(cat => {
              const val = alertGrid[group as keyof typeof alertGrid][cat as 'Technical' | 'Physical' | 'Tactical'];
              const bgCol = val > 0 ? getCategoryColor(cat as any) : '#1e293b';
              return (
                <View key={cat} style={[teamStyles.matrixCell, { backgroundColor: bgCol }]}>
                  <Text style={[teamStyles.matrixCellText, { color: val > 0 ? '#fff' : '#64748b' }]}>{val}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Player Stat Bars ───────────────────────────────────────────────────────

export function PlayerStatBars({ player }: { player: Player }) {
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
    <View style={barStyles.container}>
      <Text style={barStyles.title}>Performance vs Baseline</Text>
      {statsToRender.map((stat, i) => {
        const isBelow = stat.value < stat.base;
        return (
          <View key={i} style={barStyles.statRow}>
            <View style={barStyles.labelRow}>
              <Text style={barStyles.label}>{stat.label}</Text>
              <Text style={[barStyles.value, isBelow && { color: '#ef4444' }]}>{stat.value.toFixed(0)}{stat.suffix} <Text style={barStyles.baseValue}>(Base: {stat.base.toFixed(0)}{stat.suffix})</Text></Text>
            </View>
            <View style={barStyles.track}>
              <View style={[barStyles.fill, { width: `${(Math.min(stat.value, stat.max) / stat.max) * 100}%`, backgroundColor: isBelow ? '#ef4444' : '#10b981' }]} />
              <View style={[barStyles.baselineMarker, { left: `${(stat.base / stat.max) * 100}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Physical Output Tracker ────────────────────────────────────────────────

export function PhysicalOutputTracker({ player }: { player: Player }) {
  const coverageScores = { Wide: 100, Normal: 60, Contracted: 30 };
  const sprintScores = { High: 100, Normal: 60, Low: 30 };
  
  const covScore = coverageScores[player.stats.heatmapCoverage] || 50;
  const sprScore = sprintScores[player.stats.sprintDistance] || 50;

  return (
    <View style={heatmapStyles.container}>
      <Text style={heatmapStyles.title}>Physical Output</Text>
      
      <View style={barStyles.statRow}>
        <View style={barStyles.labelRow}>
          <Text style={barStyles.label}>Area Coverage</Text>
          <Text style={[barStyles.value, covScore < 50 && { color: '#f59e0b' }]}>{player.stats.heatmapCoverage}</Text>
        </View>
        <View style={barStyles.track}>
          <View style={[barStyles.fill, { width: `${covScore}%`, backgroundColor: covScore > 50 ? '#10b981' : '#f59e0b' }]} />
        </View>
      </View>

      <View style={barStyles.statRow}>
        <View style={barStyles.labelRow}>
          <Text style={barStyles.label}>Sprint Load</Text>
          <Text style={[barStyles.value, sprScore < 50 && { color: '#ef4444' }]}>{player.stats.sprintDistance}</Text>
        </View>
        <View style={barStyles.track}>
          <View style={[barStyles.fill, { width: `${sprScore}%`, backgroundColor: sprScore > 50 ? '#10b981' : '#ef4444' }]} />
        </View>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const teamStyles = StyleSheet.create({
  container: { backgroundColor: '#0a1628', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1a2840' },
  title: { fontSize: 16, fontWeight: '800', color: '#dde8fb', marginBottom: 16 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  chartLabelCol: { width: 100 },
  chartLabel: { fontSize: 11, color: '#7a90b0', fontWeight: '600' },
  chartValue: { fontSize: 14, color: '#dde8fb', fontWeight: '800' },
  barContainer: { flex: 1, height: 12, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#7a90b0', marginTop: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  stackedBarContainer: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 10 },
  stackedSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  matrix: { marginTop: 4, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  matrixHeaderRow: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 8 },
  matrixHeaderCell: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  matrixRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1e293b', backgroundColor: '#0a1628' },
  matrixRowLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#dde8fb', paddingVertical: 10, alignSelf: 'center' },
  matrixCell: { flex: 1, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#1e293b' },
  matrixCellText: { fontSize: 14, fontWeight: '900' },
});

const barStyles = StyleSheet.create({
  container: { marginTop: 16 },
  title: { fontSize: 12, fontWeight: '800', color: '#7a90b0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  statRow: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 12, color: '#dde8fb', fontWeight: '600' },
  value: { fontSize: 12, color: '#10b981', fontWeight: '800' },
  baseValue: { fontSize: 10, color: '#64748b', fontWeight: '500' },
  track: { height: 8, backgroundColor: '#1e293b', borderRadius: 4, position: 'relative' },
  fill: { height: '100%', borderRadius: 4 },
  baselineMarker: { position: 'absolute', top: -2, bottom: -2, width: 2, backgroundColor: '#fff', borderRadius: 1 },
});

const heatmapStyles = StyleSheet.create({
  container: { marginTop: 16 },
  title: { fontSize: 12, fontWeight: '800', color: '#7a90b0', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
});
