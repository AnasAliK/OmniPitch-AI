import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TEAMS, analyzePlayer, getPositionColor, getCategoryColor, type Player, type AnalysisResult } from '@/data/team';
import { useApp } from '@/context/AppContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

const severityColor: Record<string, string> = {
  none: '#10b981', low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};
const statusColors: Record<string, string> = {
  Active: '#10b981', 'Technical Focus': '#f59e0b', Recovery: '#8b5cf6', 'Tactical Review': '#3b82f6',
};

// ─── Player Row ─────────────────────────────────────────────────────────────

function PlayerRow({ player, onPress, isSelected, hasIntervention }: {
  player: Player; onPress: () => void; isSelected: boolean; hasIntervention: boolean;
}) {
  const analysis = analyzePlayer(player);
  const posColor = getPositionColor(player.position);
  const hasProblem = analysis.type !== 'none';

  return (
    <TouchableOpacity
      style={[rowStyles.container, isSelected && rowStyles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[rowStyles.avatar, { backgroundColor: player.avatarColor + '25' }]}>
        <Text style={[rowStyles.avatarText, { color: player.avatarColor }]}>{player.avatarInitials}</Text>
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.name}>{player.shortName}</Text>
        <View style={rowStyles.metaRow}>
          <Text style={rowStyles.flag}>{player.nationality}</Text>
          <View style={[rowStyles.posBadge, { backgroundColor: posColor + '20' }]}>
            <Text style={[rowStyles.posText, { color: posColor }]}>{player.position}</Text>
          </View>
          <Text style={rowStyles.number}>#{player.number}</Text>
        </View>
      </View>
      {hasIntervention ? (
        <View style={[rowStyles.alertBadge, { backgroundColor: '#f59e0b20' }]}>
          <Text style={[rowStyles.alertText, { color: '#f59e0b' }]}>MODIFIED</Text>
        </View>
      ) : hasProblem ? (
        <View style={[rowStyles.alertBadge, { backgroundColor: severityColor[analysis.severity] + '20' }]}>
          <View style={[rowStyles.alertDot, { backgroundColor: severityColor[analysis.severity] }]} />
          <Text style={[rowStyles.alertText, { color: severityColor[analysis.severity] }]}>
            {analysis.severity === 'critical' ? 'CRIT' : 'ALERT'}
          </Text>
        </View>
      ) : (
        <View style={[rowStyles.alertBadge, { backgroundColor: '#10b98115' }]}>
          <Text style={[rowStyles.alertText, { color: '#10b981' }]}>OK</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, marginBottom: 6, backgroundColor: 'transparent',
  },
  selected: { backgroundColor: '#1e3a5f', borderWidth: 1, borderColor: '#3b82f640' },
  avatar: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 },
  flag: { fontSize: 14 },
  posBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  posText: { fontSize: 10, fontWeight: '800' },
  number: { fontSize: 12, color: '#475569' },
  alertBadge: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, gap: 4,
  },
  alertDot: { width: 6, height: 6, borderRadius: 3 },
  alertText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});

function StatCard({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <View style={statStyles.card}>
      <Text style={[statStyles.value, highlight && { color: '#ef4444' }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, alignItems: 'center', flex: 1, marginHorizontal: 3 },
  value: { fontSize: 18, fontWeight: '800', color: '#f1f5f9' },
  label: { fontSize: 10, color: '#64748b', marginTop: 3, textAlign: 'center' },
});

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function OmniPitchDashboard() {
  const { selectedTeam, selectedTeamId, switchTeam, applyIntervention, resetIntervention, hasIntervention, overrides, isLoadingTeam } = useApp();
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(selectedTeam.players[0] || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifPayload, setNotifPayload] = useState<AnalysisResult | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const analysis = analyzePlayer(selectedPlayer);
  const isApplied = hasIntervention(selectedPlayer.id);
  const currentStatus = isApplied ? analysis.intervention.statusChange : selectedPlayer.status;
  const statusColor = statusColors[currentStatus] ?? '#64748b';

  const alertCount = selectedTeam.players.filter(p => analyzePlayer(p).hasIssue).length;
  const modifiedCount = Object.keys(overrides).length;

  useEffect(() => {
    // If the selected player isn't in the current team (because team switched), reset it
    if (selectedTeam?.players?.length > 0 && (!selectedPlayer || !selectedTeam.players.find(p => p.id === selectedPlayer.id))) {
      setSelectedPlayer(selectedTeam.players[0]);
    }
  }, [selectedTeam, selectedPlayer?.id]);

  useEffect(() => {
    if (isApplied) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [isApplied, selectedPlayer.id]);

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
  }, [isProcessing]);

  const triggerIntervention = useCallback(() => {
    if (!analysis.hasIssue) return;
    setIsProcessing(true);
    setNotifPayload(analysis);
    setTimeout(() => {
      setIsProcessing(false);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        applyIntervention(selectedPlayer);
      }, 2500);
    }, 1500);
  }, [selectedPlayer.id, analysis, applyIntervention]);

  const s = selectedPlayer.stats;
  const convRate = s.shotsTotal > 0 ? ((s.goals / s.shotsTotal) * 100).toFixed(1) : '0';
  const duelRate = s.groundDuelsTotal > 0 ? ((s.groundDuelsWon / s.groundDuelsTotal) * 100).toFixed(0) : '0';

  // Get this player's schedule modifications
  const playerOverrides = overrides[selectedPlayer.id] ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Team Selector */}
        <View style={styles.teamSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
            {TEAMS.map(team => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.teamTab,
                  selectedTeamId === team.id ? styles.teamTabActive : styles.teamTabInactive
                ]}
                onPress={() => switchTeam(team.id)}
              >
                <Text style={[
                  styles.teamTabText,
                  selectedTeamId === team.id ? styles.teamTabTextActive : styles.teamTabTextInactive
                ]}>
                  {team.shortName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>OmniPitch</Text>
              <Text style={styles.subtitle}>{selectedTeam.name} • {selectedTeam.manager}</Text>
            </View>
            <View style={styles.headerBadges}>
              <View style={styles.alertCounter}>
                <Text style={{ fontSize: 12 }}>⚠️</Text>
                <Text style={styles.alertNum}>{alertCount}</Text>
              </View>
              {modifiedCount > 0 && (
                <View style={[styles.alertCounter, { borderColor: '#f59e0b40' }]}>
                  <Text style={{ fontSize: 12 }}>📅</Text>
                  <Text style={[styles.alertNum, { color: '#f59e0b' }]}>{modifiedCount}</Text>
                </View>
              )}
            </View>
          </View>

          {isLoadingTeam ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={{ color: '#94a3b8', marginTop: 16, fontSize: 16, fontWeight: '600' }}>Running Playwright Scraper...</Text>
              <Text style={{ color: '#475569', marginTop: 8, fontSize: 13, textAlign: 'center' }}>Extracting live data from FotMob for {TEAMS.find(t => t.id === selectedTeamId)?.shortName}</Text>
            </View>
          ) : !selectedPlayer ? (
            <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>No players found.</Text>
          ) : (
            <>
              {/* Live Data Status */}
              <View style={[styles.card, { padding: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b98110', borderColor: '#10b98130', marginBottom: 16 }]}>
                <Text style={{ fontSize: 18, marginRight: 10 }}>📡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>Live Data Active</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Last extracted: {selectedTeam.lastScrapedAt ? new Date(selectedTeam.lastScrapedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : 'Local Mock Data'}
                  </Text>
                </View>
              </View>

              {/* Roster */}
              <Text style={styles.sectionLabel}>Squad ({selectedTeam.players.length})</Text>
          <View style={styles.card}>
            {selectedTeam.players.map(p => (
              <PlayerRow
                key={p.id}
                player={p}
                isSelected={selectedPlayer.id === p.id}
                hasIntervention={hasIntervention(p.id)}
                onPress={() => { setSelectedPlayer(p); fadeAnim.setValue(0); }}
              />
            ))}
          </View>

        {/* Selected Player Detail */}
        <View style={styles.detailHeader}>
          <Text style={styles.sectionLabel}>Player Analysis</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20', borderColor: statusColor + '40' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{currentStatus}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.playerBanner}>
            <View style={[styles.bigAvatar, { backgroundColor: selectedPlayer.avatarColor }]}>
              <Text style={styles.bigAvatarText}>{selectedPlayer.avatarInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{selectedPlayer.name}</Text>
              <Text style={styles.playerMeta}>
                {selectedPlayer.nationality} {selectedPlayer.position} • #{selectedPlayer.number} • Age {selectedPlayer.age}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatCard value={String(s.goals)} label="Goals" highlight={analysis.category === 'Technical'} />
            <StatCard value={String(s.xG)} label="xG" />
            <StatCard value={String(s.assists)} label="Assists" />
            <StatCard value={String(s.xA)} label="xA" />
          </View>
          <View style={[styles.statsRow, { marginTop: 6 }]}>
            <StatCard value={`${s.minutesPlayed}'`} label="Minutes" highlight={analysis.category === 'Physical'} />
            <StatCard value={`${duelRate}%`} label="Duels" />
            <StatCard value={`${s.passingAccuracy}%`} label="Pass %" />
            {s.savePercentage !== undefined ? (
              <StatCard value={`${s.savePercentage}%`} label="Save %" highlight={analysis.category === 'Tactical'} />
            ) : (
              <StatCard value={`${convRate}%`} label="Conv %" highlight={analysis.category === 'Technical'} />
            )}
          </View>
        </View>

        {/* Analysis Insight */}
        {analysis.hasIssue && !isApplied && (
          <View style={[styles.insightCard, { borderColor: severityColor[analysis.severity] + '40' }]}>
            <View style={styles.insightHeader}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
              <Text style={[styles.insightLabel, { color: severityColor[analysis.severity] }]}>{analysis.title}</Text>
              <View style={[styles.confBadge, { backgroundColor: severityColor[analysis.severity] + '20' }]}>
                <Text style={[styles.confText, { color: severityColor[analysis.severity] }]}>{analysis.confidence}%</Text>
              </View>
            </View>
            <Text style={styles.insightBody}>{analysis.reasoning}</Text>
            <View style={styles.indicatorRow}>
              {analysis.indicators.map((ind, i) => (
                <View key={i} style={[styles.indicator, { backgroundColor: ind.color + '15' }]}>
                  <Text style={[styles.indValue, { color: ind.color }]}>{ind.value}</Text>
                  <Text style={styles.indLabel}>{ind.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Intervention Applied — show schedule changes */}
        {isApplied && (
          <Animated.View style={[styles.appliedCard, { opacity: fadeAnim }]}>
            <View style={styles.appliedHeader}>
              <Text style={{ fontSize: 20 }}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.appliedTitle}>Intervention Applied — Schedule Modified</Text>
                <Text style={styles.appliedScenario}>{analysis.title}</Text>
              </View>
            </View>
            {playerOverrides.map((o, i) => (
              <View key={i} style={styles.schedChangeRow}>
                <View style={styles.schedOriginal}>
                  <Text style={styles.schedStrike}>{o.originalSessionId === 'thu-morning' ? 'Team Tactical Session' : o.originalSessionId === 'thu-afternoon' ? 'Positional Play & Rondos' : o.originalSessionId === 'thu-gk' ? 'GK Distribution & Shot-Stopping' : o.originalSessionId === 'fri-morning' ? 'MD-1: Set Pieces' : o.originalSessionId}</Text>
                </View>
                <Text style={styles.schedArrow}>→</Text>
                <View style={styles.schedNew}>
                  <Text style={styles.schedNewIcon}>{o.replacementSession.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.schedNewTitle}>{o.replacementSession.title}</Text>
                    <Text style={styles.schedNewMeta}>{o.replacementSession.day} {o.replacementSession.time} • {o.replacementSession.duration}</Text>
                  </View>
                </View>
              </View>
            ))}
            <Text style={styles.appliedHint}>📅 View full schedule in the Schedule tab</Text>
          </Animated.View>
        )}

        {/* Action Button */}
        {analysis.hasIssue && (
          <TouchableOpacity
            style={[styles.actionBtn, isApplied && styles.actionBtnDone, isProcessing && styles.actionBtnProc]}
            onPress={triggerIntervention}
            disabled={isApplied || isProcessing}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.actionInner, isProcessing && { opacity: pulseAnim }]}>
              <Text style={{ fontSize: 18 }}>
                {isProcessing ? '⏳' : isApplied ? '✅' : '🤖'}
              </Text>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={[styles.actionText, isApplied && { color: '#475569' }]}>
                  {isProcessing ? 'Analyzing Performance Data...' : isApplied ? 'Intervention Applied' : 'Apply Intervention'}
                </Text>
                {!isApplied && !isProcessing && (
                  <Text style={styles.actionSub}>Adjusts training schedule for {selectedPlayer.shortName}</Text>
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>
        )}

        {!analysis.hasIssue && (
          <View style={styles.allGoodCard}>
            <Text style={{ fontSize: 20 }}>✅</Text>
            <Text style={styles.allGoodText}>No intervention needed. Performance within baselines.</Text>
          </View>
        )}

        {isApplied && (
          <TouchableOpacity style={styles.resetBtn} onPress={() => resetIntervention(selectedPlayer.id)}>
            <Text style={styles.resetText}>↻ Reset Intervention for {selectedPlayer.shortName}</Text>
          </TouchableOpacity>
        )}

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
            <Text style={styles.modalTitle}>Intervention: {selectedPlayer.shortName}</Text>
            <Text style={styles.modalBody}>{notifPayload?.reasoning ?? ''}</Text>
            <Text style={styles.modalScheduleNote}>
              📅 Training schedule will be adjusted for the next 48 hours.
            </Text>
            <View style={styles.chipRow}>
              {[selectedTeam.manager, selectedPlayer.shortName].map((r, i) => (
                <View key={i} style={styles.chip}><Text style={styles.chipText}>{r}</Text></View>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flex: 1 },
  teamSelector: { marginBottom: 15, marginTop: 10 },
  teamTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  teamTabActive: { backgroundColor: '#3b82f620', borderColor: '#3b82f6' },
  teamTabInactive: { backgroundColor: '#1e293b', borderColor: '#334155' },
  teamTabText: { fontSize: 13, fontWeight: '700' },
  teamTabTextActive: { color: '#3b82f6' },
  teamTabTextInactive: { color: '#64748b' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  headerBadges: { flexDirection: 'row', gap: 8 },
  alertCounter: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: '#334155', gap: 5,
  },
  alertNum: { fontSize: 13, fontWeight: '800', color: '#ef4444' },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 10 },
  card: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#334155',
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, marginBottom: 10,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  playerBanner: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bigAvatar: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  bigAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  playerName: { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  playerMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statsRow: { flexDirection: 'row' },
  insightCard: {
    backgroundColor: '#172554', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  insightLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  confBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  confText: { fontSize: 11, fontWeight: '800' },
  insightBody: { fontSize: 14, color: '#cbd5e1', lineHeight: 22, marginBottom: 12 },
  indicatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  indicator: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  indValue: { fontSize: 13, fontWeight: '700' },
  indLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  appliedCard: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#10b98130',
  },
  appliedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  appliedTitle: { fontSize: 14, fontWeight: '700', color: '#10b981' },
  appliedScenario: { fontSize: 12, color: '#64748b', marginTop: 2 },
  schedChangeRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8,
  },
  schedOriginal: {
    flex: 1, backgroundColor: '#0f172a', borderRadius: 8, padding: 10,
  },
  schedStrike: { fontSize: 12, color: '#64748b', textDecorationLine: 'line-through' },
  schedArrow: { fontSize: 16, color: '#f59e0b', fontWeight: '800' },
  schedNew: {
    flex: 1.5, flexDirection: 'row', backgroundColor: '#f59e0b10', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: '#f59e0b25', gap: 8,
  },
  schedNewIcon: { fontSize: 16, marginTop: 1 },
  schedNewTitle: { fontSize: 12, fontWeight: '700', color: '#fbbf24' },
  schedNewMeta: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  appliedHint: { fontSize: 12, color: '#475569', marginTop: 8, textAlign: 'center' },
  actionBtn: {
    backgroundColor: '#3b82f6', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  actionBtnDone: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', shadowOpacity: 0, elevation: 0,
  },
  actionBtnProc: { backgroundColor: '#1e40af' },
  actionInner: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionSub: { color: '#93c5fd', fontSize: 12, marginTop: 2 },
  allGoodCard: {
    flexDirection: 'row', backgroundColor: '#10b98110', borderRadius: 14, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#10b98125', alignItems: 'center', gap: 12,
  },
  allGoodText: { fontSize: 14, color: '#94a3b8', flex: 1, lineHeight: 22 },
  resetBtn: { alignItems: 'center', padding: 12 },
  resetText: { color: '#475569', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1, borderColor: '#334155',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#475569', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  priorBadge: {
    backgroundColor: '#dc262620', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#dc262640',
  },
  priorText: { color: '#fca5a5', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginBottom: 8 },
  modalBody: { fontSize: 15, color: '#94a3b8', lineHeight: 24, marginBottom: 12 },
  modalScheduleNote: { fontSize: 13, color: '#f59e0b', marginBottom: 16, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: '#334155', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
});
