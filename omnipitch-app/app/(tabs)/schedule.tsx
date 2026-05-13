import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_SCHEDULE, type PracticeSession, type PlayerOverride } from '@/data/schedule';
import { useApp } from '@/context/AppContext';

// ─── Session Type Colors ────────────────────────────────────────────────────

const typeColors: Record<string, string> = {
  team: '#3b82f6',
  positional: '#10b981',
  recovery: '#8b5cf6',
  tactical: '#f59e0b',
  individual: '#ef4444',
};

const typeLabels: Record<string, string> = {
  team: 'TEAM',
  positional: 'POSITIONAL',
  recovery: 'RECOVERY',
  tactical: 'TACTICAL',
  individual: 'INDIVIDUAL',
};

// ─── Session Card ───────────────────────────────────────────────────────────

function SessionCard({ session, overrides }: { session: PracticeSession; overrides: PlayerOverride[] }) {
  const color = typeColors[session.type] ?? '#64748b';
  const hasOverrides = overrides.length > 0;

  return (
    <View style={[cardStyles.container, { borderLeftColor: color }]}>
      {/* Header */}
      <View style={cardStyles.header}>
        <Text style={cardStyles.icon}>{session.icon}</Text>
        <View style={cardStyles.headerInfo}>
          <Text style={cardStyles.title}>{session.title}</Text>
          <View style={cardStyles.metaRow}>
            <Text style={cardStyles.time}>{session.time}</Text>
            <Text style={cardStyles.dot}>•</Text>
            <Text style={cardStyles.duration}>{session.duration}</Text>
            <View style={[cardStyles.typeBadge, { backgroundColor: color + '20' }]}>
              <Text style={[cardStyles.typeText, { color }]}>{typeLabels[session.type]}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Participants */}
      <View style={cardStyles.participantRow}>
        <Text style={cardStyles.participantLabel}>👥</Text>
        <Text style={cardStyles.participantText}>{session.participants}</Text>
      </View>

      {/* Notes */}
      {session.notes && (
        <Text style={cardStyles.notes}>{session.notes}</Text>
      )}

      {/* Player Overrides */}
      {hasOverrides && (
        <View style={cardStyles.overridesSection}>
          <Text style={cardStyles.overridesTitle}>⚠️ Player Adjustments</Text>
          {overrides.map((o, i) => (
            <View key={i} style={cardStyles.overrideRow}>
              <View style={cardStyles.overrideHeader}>
                <View style={cardStyles.overridePlayerBadge}>
                  <Text style={cardStyles.overridePlayerText}>{o.playerName}</Text>
                </View>
                <View style={cardStyles.overrideScenBadge}>
                  <Text style={cardStyles.overrideScenText}>{o.scenarioLabel}</Text>
                </View>
              </View>
              <View style={cardStyles.replacementCard}>
                <Text style={cardStyles.replacementIcon}>{o.replacementSession.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={cardStyles.replacementTitle}>{o.replacementSession.title}</Text>
                  <Text style={cardStyles.replacementMeta}>
                    {o.replacementSession.time} • {o.replacementSession.duration}
                  </Text>
                  {o.replacementSession.notes && (
                    <Text style={cardStyles.replacementNotes}>{o.replacementSession.notes}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Day Group ──────────────────────────────────────────────────────────────

function DayGroup({ day, date, sessions, getOverridesForSession }: {
  day: string;
  date: string;
  sessions: PracticeSession[];
  getOverridesForSession: (id: string) => PlayerOverride[];
}) {
  return (
    <View style={dayStyles.container}>
      <View style={dayStyles.header}>
        <Text style={dayStyles.day}>{day}</Text>
        <Text style={dayStyles.date}>{date}</Text>
      </View>
      {sessions.map(s => (
        <SessionCard
          key={s.id}
          session={s}
          overrides={getOverridesForSession(s.id)}
        />
      ))}
    </View>
  );
}

const dayStyles = StyleSheet.create({
  container: { marginBottom: 24 },
  header: {
    flexDirection: 'row', alignItems: 'baseline', marginBottom: 12, gap: 8,
  },
  day: { fontSize: 20, fontWeight: '800', color: '#f1f5f9' },
  date: { fontSize: 14, color: '#64748b', fontWeight: '500' },
});

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const { overrides, getOverridesForSession, resetAll } = useApp();

  // Group sessions by day
  const days = DEFAULT_SCHEDULE.reduce<Record<string, { date: string; sessions: PracticeSession[] }>>((acc, s) => {
    if (!acc[s.day]) acc[s.day] = { date: s.date, sessions: [] };
    acc[s.day].sessions.push(s);
    return acc;
  }, {});

  const totalOverrides = Object.values(overrides).reduce((sum, arr) => sum + arr.length, 0);
  const playersAffected = Object.keys(overrides).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Training Schedule</Text>
            <Text style={styles.subtitle}>Weekly Plan • Coach View</Text>
          </View>
          {totalOverrides > 0 && (
            <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary Bar */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{DEFAULT_SCHEDULE.length}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
          <View style={[styles.summaryCard, totalOverrides > 0 && { borderColor: '#f59e0b40' }]}>
            <Text style={[styles.summaryNum, { color: totalOverrides > 0 ? '#f59e0b' : '#10b981' }]}>
              {totalOverrides}
            </Text>
            <Text style={styles.summaryLabel}>Adjustments</Text>
          </View>
          <View style={[styles.summaryCard, playersAffected > 0 && { borderColor: '#ef444440' }]}>
            <Text style={[styles.summaryNum, { color: playersAffected > 0 ? '#ef4444' : '#10b981' }]}>
              {playersAffected}
            </Text>
            <Text style={styles.summaryLabel}>Players</Text>
          </View>
        </View>

        {/* Info banner */}
        {totalOverrides > 0 && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              {playersAffected} player{playersAffected > 1 ? 's have' : ' has'} modified schedules.
              Adjustments are shown inline below each affected session.
            </Text>
          </View>
        )}

        {/* Schedule */}
        {Object.entries(days).map(([day, { date, sessions }]) => (
          <DayGroup
            key={day}
            day={day}
            date={date}
            sessions={sessions}
            getOverridesForSession={getOverridesForSession}
          />
        ))}

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Session Types</Text>
          <View style={styles.legendGrid}>
            {Object.entries(typeLabels).map(([key, label]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: typeColors[key] }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  resetBtn: {
    backgroundColor: '#ef444420', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#ef444440',
  },
  resetText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  summaryNum: { fontSize: 24, fontWeight: '800', color: '#f1f5f9' },
  summaryLabel: { fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: '600' },
  infoBanner: {
    flexDirection: 'row', backgroundColor: '#f59e0b10', borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#f59e0b20', alignItems: 'flex-start', gap: 10,
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: { fontSize: 13, color: '#94a3b8', lineHeight: 20, flex: 1 },
  legendCard: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#334155',
  },
  legendTitle: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 12 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
});

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#334155', borderLeftWidth: 4,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  icon: { fontSize: 22, marginRight: 12, marginTop: 1 },
  headerInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  time: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  dot: { color: '#475569', fontSize: 10 },
  duration: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  typeBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 },
  typeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  participantLabel: { fontSize: 14 },
  participantText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  notes: { fontSize: 13, color: '#475569', lineHeight: 20, marginTop: 4 },
  overridesSection: {
    marginTop: 14, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12,
  },
  overridesTitle: { fontSize: 13, fontWeight: '700', color: '#f59e0b', marginBottom: 10 },
  overrideRow: { marginBottom: 10 },
  overrideHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  overridePlayerBadge: {
    backgroundColor: '#3b82f620', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  overridePlayerText: { color: '#3b82f6', fontSize: 11, fontWeight: '700' },
  overrideScenBadge: {
    backgroundColor: '#ef444420', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  overrideScenText: { color: '#ef4444', fontSize: 10, fontWeight: '700' },
  replacementCard: {
    flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#f59e0b30', gap: 10,
  },
  replacementIcon: { fontSize: 20, marginTop: 2 },
  replacementTitle: { fontSize: 14, fontWeight: '700', color: '#fbbf24' },
  replacementMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  replacementNotes: { fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 18 },
});
