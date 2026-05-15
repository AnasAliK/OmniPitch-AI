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
import { LinearGradient } from 'expo-linear-gradient';
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
  container: { marginBottom: 26 },
  header: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12, gap: 10 },
  day: { fontSize: 20, fontWeight: '900', color: '#dde8fb', letterSpacing: -0.3 },
  date: { fontSize: 13, color: '#3d5068', fontWeight: '600' },
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
        <LinearGradient
          colors={['#112060', '#071428']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>📅  COACH VIEW</Text>
              <Text style={styles.heroTitle}>Training Schedule</Text>
              <Text style={styles.heroSub}>Weekly Plan</Text>
            </View>
            {totalOverrides > 0 && (
              <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
                <Text style={styles.resetText}>Reset All</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View style={styles.content}>

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
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: '#3b6cc0', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#e8f0ff', letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: '#4a6fa5', marginTop: 6 },
  resetBtn: {
    backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  resetText: { color: '#f87171', fontSize: 12, fontWeight: '800' },
  content: { padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: '#08142a', borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#0f2040',
  },
  summaryNum: { fontSize: 26, fontWeight: '900', color: '#c8d8f0', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 10, color: '#2d4a6e', marginTop: 4, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  infoBanner: {
    flexDirection: 'row', backgroundColor: '#fbbf2410', borderRadius: 13, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: '#fbbf2420', alignItems: 'flex-start', gap: 10,
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: { fontSize: 13, color: '#7a90b0', lineHeight: 20, flex: 1 },
  legendCard: {
    backgroundColor: '#08142a', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#0f2040', marginBottom: 30,
  },
  legendTitle: { fontSize: 10, fontWeight: '900', color: '#2d4a6e', marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#4a6fa5', fontWeight: '700' },
});

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0d1826', borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#1a2840', borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  icon: { fontSize: 22, marginRight: 12, marginTop: 1 },
  headerInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: '#dde8fb', letterSpacing: 0.1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  time: { fontSize: 13, color: '#7a90b0', fontWeight: '600' },
  dot: { color: '#3d5068', fontSize: 10 },
  duration: { fontSize: 13, color: '#7a90b0', fontWeight: '600' },
  typeBadge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, marginLeft: 4 },
  typeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  participantLabel: { fontSize: 14 },
  participantText: { fontSize: 13, color: '#7a90b0', fontWeight: '600' },
  notes: { fontSize: 12, color: '#3d5068', lineHeight: 20, marginTop: 4 },
  overridesSection: {
    marginTop: 14, borderTopWidth: 1, borderTopColor: '#1a2840', paddingTop: 12,
  },
  overridesTitle: { fontSize: 12, fontWeight: '800', color: '#fbbf24', marginBottom: 10, letterSpacing: 0.3 },
  overrideRow: { marginBottom: 10 },
  overrideHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  overridePlayerBadge: {
    backgroundColor: '#4f8ef720', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: '#4f8ef730',
  },
  overridePlayerText: { color: '#4f8ef7', fontSize: 11, fontWeight: '800' },
  overrideScenBadge: {
    backgroundColor: '#f8717118', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: '#f8717130',
  },
  overrideScenText: { color: '#f87171', fontSize: 10, fontWeight: '800' },
  replacementCard: {
    flexDirection: 'row', backgroundColor: '#080d16', borderRadius: 11, padding: 12,
    borderWidth: 1, borderColor: '#fbbf2425', gap: 10,
  },
  replacementIcon: { fontSize: 20, marginTop: 2 },
  replacementTitle: { fontSize: 14, fontWeight: '800', color: '#fbbf24' },
  replacementMeta: { fontSize: 12, color: '#7a90b0', marginTop: 2 },
  replacementNotes: { fontSize: 12, color: '#3d5068', marginTop: 4, lineHeight: 18 },
});
