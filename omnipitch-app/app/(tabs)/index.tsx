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
  Image,
  LayoutAnimation,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TEAMS, analyzePlayer, getPositionColor, getCategoryColor, type Player, type AnalysisResult } from '@/data/team';
import { useApp } from '@/context/AppContext';
import { TeamPerformanceSummary, PlayerStatBars, PhysicalOutputTracker } from '@/components/DashboardVisuals';

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
  const statusCol = hasIntervention ? '#f59e0b' : hasProblem ? severityColor[analysis.severity] : '#22c55e';
  const statusLabel = hasIntervention ? 'MOD' : hasProblem ? (analysis.severity === 'critical' ? 'CRIT' : 'ALRT') : 'OK';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[rowStyles.container, isSelected ? rowStyles.selected : null]}>
      {isSelected && <View style={[rowStyles.selectedBar, { backgroundColor: statusCol }]} />}
      <View style={[rowStyles.avatar, { backgroundColor: player.avatarColor }]}>
        {player.imageUrl ? (
          <Image source={{ uri: player.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Text style={rowStyles.avatarText}>{player.avatarInitials}</Text>
        )}
      </View>
      <View style={rowStyles.infoContainer}>
        <Text style={rowStyles.name}>{player.shortName}</Text>
        <View style={rowStyles.metaRow}>
          <View style={[rowStyles.posBadge, { borderColor: posColor + '60' }]}>
            <Text style={[rowStyles.posText, { color: posColor }]}>{player.position}</Text>
          </View>
          <Text style={rowStyles.number}>#{player.number}</Text>
        </View>
      </View>
      <View style={[rowStyles.statusChip, { backgroundColor: statusCol + '18', borderColor: statusCol + '50' }]}>
        <View style={[rowStyles.statusDot, { backgroundColor: statusCol }]} />
        <Text style={[rowStyles.statusText, { color: statusCol }]}>{statusLabel}</Text>
      </View>
      <View style={rowStyles.chevron}>
        <Text style={{ color: '#4a6fa5', fontSize: 12 }}>{isSelected ? '▲' : '▼'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    width: '100%', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 14, backgroundColor: '#0a1628',
    borderWidth: 1, borderColor: '#142035',
  },
  selected: {
    backgroundColor: '#0d2242', borderColor: '#1e3d70',
  },
  selectedBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#fff' },
  infoContainer: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: '#e2eeff', letterSpacing: 0.1, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  posBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  posText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  number: { fontSize: 11, color: '#2d4a6e', fontWeight: '700' },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 5, gap: 5, borderWidth: 1, marginRight: 6,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  chevron: { paddingLeft: 4, paddingRight: 4, width: 20, alignItems: 'center' },
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
  card: {
    backgroundColor: '#080d16', borderRadius: 12, padding: 13,
    alignItems: 'center', flex: 1, marginHorizontal: 3,
    borderWidth: 1, borderColor: '#1a2840',
  },
  value: { fontSize: 19, fontWeight: '900', color: '#dde8fb', letterSpacing: -0.5 },
  label: { fontSize: 9, color: '#3d5068', marginTop: 4, textAlign: 'center', fontWeight: '700', letterSpacing: 0.5 },
});

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function OmniPitchDashboard() {
  const { selectedTeam, selectedTeamId, switchTeam, applyIntervention, resetIntervention, hasIntervention, overrides, isLoadingTeam } = useApp();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notifPayload, setNotifPayload] = useState<AnalysisResult | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  const triggerIntervention = useCallback(() => {
    if (!selectedPlayer) return;
    const currentAnalysis = analyzePlayer(selectedPlayer);
    if (!currentAnalysis.hasIssue) return;
    setIsProcessing(true);
    setNotifPayload(currentAnalysis);
    setTimeout(() => {
      setIsProcessing(false);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
        applyIntervention(selectedPlayer);
      }, 2500);
    }, 1500);
  }, [selectedPlayer, applyIntervention]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={['#112060', '#071428']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>⚽  OMNIPITCH AI</Text>
              <Text style={styles.heroTitle}>{selectedTeam?.name}</Text>
              <Text style={styles.heroSub}>🧑‍💼 {selectedTeam?.manager}</Text>
            </View>
            <View style={styles.heroCounters}>
              <View style={styles.heroCounter}>
                <Text style={[styles.heroCountNum, { color: '#f87171' }]}>{alertCount}</Text>
                <Text style={styles.heroCountLabel}>Alerts</Text>
              </View>
              {modifiedCount > 0 && (
                <View style={[styles.heroCounter, { borderColor: '#f59e0b40' }]}>
                  <Text style={[styles.heroCountNum, { color: '#f59e0b' }]}>{modifiedCount}</Text>
                  <Text style={styles.heroCountLabel}>Modified</Text>
                </View>
              )}
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teamPills}>
            {TEAMS.map(team => (
              <TouchableOpacity
                key={team.id}
                style={[styles.teamPill, selectedTeamId === team.id && styles.teamPillActive]}
                onPress={() => switchTeam(team.id)}
              >
                <Text style={[styles.teamPillText, selectedTeamId === team.id && styles.teamPillTextActive]}>
                  {team.shortName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>

        <View style={{ paddingHorizontal: 16 }}>
          {isLoadingTeam ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={{ color: '#94a3b8', marginTop: 16, fontSize: 16, fontWeight: '600' }}>Fetching Live Squad Data...</Text>
              <Text style={{ color: '#475569', marginTop: 8, fontSize: 13, textAlign: 'center' }}>Extracting live data for {TEAMS.find(t => t.id === selectedTeamId)?.shortName}</Text>
            </View>
          ) : !selectedTeam?.players?.length ? (
            <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>No players found.</Text>
          ) : (
            <>
              {/* Live Data Status */}
              <View style={[styles.card, { padding: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b98110', borderColor: '#10b98130', marginBottom: 16 }]}>
                <Text style={{ fontSize: 18, marginRight: 10 }}>📡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>Live Data Active</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Last extracted: {selectedTeam.lastScrapedAt ? new Date(selectedTeam.lastScrapedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Local Mock Data'}
                  </Text>
                </View>
              </View>

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
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          if (isSel) {
                            setSelectedPlayer(null);
                          } else {
                            setSelectedPlayer(p);
                            fadeAnim.setValue(0);
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
                            <StatCard value={String(pStats.goals)} label="Goals" highlight={pAnalysis.category === 'Technical'} />
                            <StatCard value={String(pStats.xG)} label="xG" />
                            <StatCard value={String(pStats.assists)} label="Assists" />
                            <StatCard value={String(pStats.xA)} label="xA" />
                          </View>
                          <View style={[styles.statsRow, { marginTop: 6 }]}>
                            <StatCard value={`${pStats.minutesPlayed}'`} label="Minutes" highlight={pAnalysis.category === 'Physical'} />
                            <StatCard value={`${pDuelRate}%`} label="Duels" />
                            <StatCard value={`${pStats.passingAccuracy}%`} label="Pass %" />
                            {pStats.savePercentage !== undefined ? (
                              <StatCard value={`${pStats.savePercentage}%`} label="Save %" highlight={pAnalysis.category === 'Tactical'} />
                            ) : (
                              <StatCard value={`${pConvRate}%`} label="Conv %" highlight={pAnalysis.category === 'Technical'} />
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

                          {/* Analysis Insight */}
                          {pAnalysis.hasIssue && !pIsApplied && (
                            <View style={[styles.insightCard, { borderColor: severityColor[pAnalysis.severity] + '40' }]}>
                              <View style={styles.insightHeader}>
                                <Text style={{ fontSize: 16 }}>🔍</Text>
                                <Text style={[styles.insightLabel, { color: severityColor[pAnalysis.severity] }]}>{pAnalysis.title}</Text>
                                <View style={[styles.confBadge, { backgroundColor: severityColor[pAnalysis.severity] + '20' }]}>
                                  <Text style={[styles.confText, { color: severityColor[pAnalysis.severity] }]}>{pAnalysis.confidence}%</Text>
                                </View>
                              </View>
                              <Text style={styles.insightBody}>{pAnalysis.reasoning}</Text>
                              <View style={styles.indicatorRow}>
                                {pAnalysis.indicators.map((ind, i) => (
                                  <View key={i} style={[styles.indicator, { backgroundColor: ind.color + '15' }]}>
                                    <Text style={[styles.indValue, { color: ind.color }]}>{ind.value}</Text>
                                    <Text style={styles.indLabel}>{ind.label}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}

                          {/* Intervention Applied — show schedule changes */}
                          {pIsApplied && (
                            <Animated.View style={[styles.appliedCard, { opacity: fadeAnim }]}>
                              <View style={styles.appliedHeader}>
                                <Text style={{ fontSize: 20 }}>✅</Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.appliedTitle}>Intervention Applied</Text>
                                  <Text style={styles.appliedScenario}>{pAnalysis.title}</Text>
                                </View>
                              </View>
                              {pOverrides.map((o, i) => (
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
                          {pAnalysis.hasIssue && (
                            <TouchableOpacity
                              style={[styles.actionBtn, pIsApplied && styles.actionBtnDone, isProcessing && styles.actionBtnProc]}
                              onPress={triggerIntervention}
                              disabled={pIsApplied || isProcessing}
                              activeOpacity={0.8}
                            >
                              <Animated.View style={[styles.actionInner, isProcessing && { opacity: pulseAnim }]}>
                                <Text style={{ fontSize: 18 }}>
                                  {isProcessing ? '⏳' : pIsApplied ? '✅' : '🤖'}
                                </Text>
                                <View style={{ marginLeft: 10, flex: 1 }}>
                                  <Text style={[styles.actionText, pIsApplied && { color: '#475569' }]}>
                                    {isProcessing ? 'Analyzing...' : pIsApplied ? 'Intervention Applied' : 'Apply Intervention'}
                                  </Text>
                                  {!pIsApplied && !isProcessing && (
                                    <Text style={styles.actionSub}>Adjusts training schedule</Text>
                                  )}
                                </View>
                              </Animated.View>
                            </TouchableOpacity>
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
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#050c18' },
  scroll: { flex: 1 },
  hero: { paddingTop: Platform.OS === 'android' ? 16 : 10, paddingBottom: 18, paddingHorizontal: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: '#3b6cc0', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#e8f0ff', letterSpacing: -0.5, lineHeight: 30 },
  heroSub: { fontSize: 13, color: '#4a6fa5', marginTop: 6, fontWeight: '500' },
  heroCounters: { gap: 8, alignItems: 'flex-end' },
  heroCounter: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minWidth: 62,
  },
  heroCountNum: { fontSize: 22, fontWeight: '900', color: '#e8f0ff', letterSpacing: -0.5 },
  heroCountLabel: { fontSize: 9, color: '#3b6cc0', fontWeight: '800', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
  teamPills: { gap: 8, paddingBottom: 2 },
  teamPill: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  teamPillActive: { backgroundColor: '#1e4db7', borderColor: '#3b82f6' },
  teamPillText: { fontSize: 13, fontWeight: '700', color: '#4a6fa5' },
  teamPillTextActive: { color: '#fff' },
  sectionLabel: {
    fontSize: 10, fontWeight: '900', color: '#2d4a6e',
    marginBottom: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4,
  },
  card: {
    backgroundColor: '#08142a', borderRadius: 16, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#0f2040',
  },
  dropdownDetail: {
    backgroundColor: '#08142a',
    borderWidth: 1,
    borderColor: '#1e3d70',
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
    marginRight: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  bigAvatarText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  playerName: { fontSize: 18, fontWeight: '800', color: '#dde8fb', letterSpacing: -0.3 },
  playerMeta: { fontSize: 12, color: '#3d5068', marginTop: 3, fontWeight: '500' },
  statsRow: { flexDirection: 'row' },
  insightCard: {
    backgroundColor: '#091426', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  insightLabel: { fontSize: 14, fontWeight: '800', flex: 1, letterSpacing: 0.1 },
  confBadge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  confText: { fontSize: 11, fontWeight: '900' },
  insightBody: { fontSize: 13, color: '#7a90b0', lineHeight: 21, marginBottom: 12 },
  indicatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  indicator: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  indValue: { fontSize: 13, fontWeight: '800' },
  indLabel: { fontSize: 10, color: '#3d5068', marginTop: 2, fontWeight: '600' },
  appliedCard: {
    backgroundColor: '#0d1826', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#22d3a030',
    shadowColor: '#22d3a0', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  appliedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  appliedTitle: { fontSize: 14, fontWeight: '800', color: '#22d3a0' },
  appliedScenario: { fontSize: 12, color: '#3d5068', marginTop: 2 },
  schedChangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  schedOriginal: { flex: 1, backgroundColor: '#080d16', borderRadius: 9, padding: 10 },
  schedStrike: { fontSize: 12, color: '#3d5068', textDecorationLine: 'line-through' },
  schedArrow: { fontSize: 16, color: '#fbbf24', fontWeight: '900' },
  schedNew: {
    flex: 1.5, flexDirection: 'row', backgroundColor: '#fbbf2410', borderRadius: 9, padding: 10,
    borderWidth: 1, borderColor: '#fbbf2425', gap: 8,
  },
  schedNewIcon: { fontSize: 16, marginTop: 1 },
  schedNewTitle: { fontSize: 12, fontWeight: '800', color: '#fbbf24' },
  schedNewMeta: { fontSize: 10, color: '#7a90b0', marginTop: 2 },
  appliedHint: { fontSize: 12, color: '#3d5068', marginTop: 8, textAlign: 'center' },
  actionBtn: {
    backgroundColor: '#2563eb', borderRadius: 16, padding: 18, marginBottom: 10,
    shadowColor: '#4f8ef7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  actionBtnDone: {
    backgroundColor: '#0d1826', borderWidth: 1, borderColor: '#1a2840', shadowOpacity: 0, elevation: 0,
  },
  actionBtnProc: { backgroundColor: '#1d4ed8' },
  actionInner: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  actionSub: { color: '#93c5fd', fontSize: 12, marginTop: 2 },
  allGoodCard: {
    flexDirection: 'row', backgroundColor: '#22d3a010', borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#22d3a020', alignItems: 'center', gap: 12,
  },
  allGoodText: { fontSize: 14, color: '#7a90b0', flex: 1, lineHeight: 22 },
  resetBtn: { alignItems: 'center', padding: 14 },
  resetText: { color: '#3d5068', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#0d1826', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    borderTopWidth: 1, borderColor: '#1e2d42',
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 30, elevation: 30,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: '#1e2d42', borderRadius: 2, alignSelf: 'center', marginBottom: 22 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  priorBadge: {
    backgroundColor: '#f8717120', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#f8717140',
  },
  priorText: { color: '#fca5a5', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#dde8fb', marginBottom: 8, letterSpacing: -0.3 },
  modalBody: { fontSize: 14, color: '#7a90b0', lineHeight: 23, marginBottom: 14 },
  modalScheduleNote: { fontSize: 13, color: '#fbbf24', marginBottom: 16, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: '#1a2840', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 7, borderWidth: 1, borderColor: '#1e2d42' },
  chipText: { color: '#7a90b0', fontSize: 12, fontWeight: '700' },
});
