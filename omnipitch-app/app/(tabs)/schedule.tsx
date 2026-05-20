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

function SessionCard({ session, overrides, colors }: { session: PracticeSession; overrides: PlayerOverride[]; colors: any }) {
  const cStyles = React.useMemo(() => createCardStyles(colors), [colors]);
  const color = typeColors[session.type] ?? colors.textMuted;
  const hasOverrides = overrides.length > 0;

  return (
    <View style={[cStyles.container, { borderLeftColor: color }]}>
      {/* Header */}
      <View style={cStyles.header}>
        <Text style={cStyles.icon}>{session.icon}</Text>
        <View style={cStyles.headerInfo}>
          <Text style={cStyles.title}>{session.title}</Text>
          <View style={cStyles.metaRow}>
            <Text style={cStyles.time}>{session.time}</Text>
            <Text style={cStyles.dot}>•</Text>
            <Text style={cStyles.duration}>{session.duration}</Text>
            <View style={[cStyles.typeBadge, { backgroundColor: color + '20' }]}>
              <Text style={[cStyles.typeText, { color }]}>{typeLabels[session.type]}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Participants */}
      <View style={cStyles.participantRow}>
        <Text style={cStyles.participantLabel}>👥</Text>
        <Text style={cStyles.participantText}>{session.participants}</Text>
      </View>

      {/* Notes */}
      {session.notes && (
        <Text style={cStyles.notes}>{session.notes}</Text>
      )}

      {/* Player Overrides */}
      {hasOverrides && (
        <View style={cStyles.overridesSection}>
          <Text style={cStyles.overridesTitle}>⚠️ Player Adjustments</Text>
          {overrides.map((o, i) => (
            <View key={i} style={cStyles.overrideRow}>
              <View style={cStyles.overrideHeader}>
                <View style={cStyles.overridePlayerBadge}>
                  <Text style={cStyles.overridePlayerText}>{o.playerName}</Text>
                </View>
                <View style={cStyles.overrideScenBadge}>
                  <Text style={cStyles.overrideScenText}>{o.scenarioLabel}</Text>
                </View>
              </View>
              <View style={cStyles.replacementCard}>
                <Text style={cStyles.replacementIcon}>{o.replacementSession.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={cStyles.replacementTitle}>{o.replacementSession.title}</Text>
                  <Text style={cStyles.replacementMeta}>
                    {o.replacementSession.time} • {o.replacementSession.duration}
                  </Text>
                  {o.replacementSession.notes && (
                    <Text style={cStyles.replacementNotes}>{o.replacementSession.notes}</Text>
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

function DayGroup({ day, date, sessions, getOverridesForSession, colors }: {
  day: string;
  date: string;
  sessions: PracticeSession[];
  getOverridesForSession: (id: string) => PlayerOverride[];
  colors: any;
}) {
  const dStyles = React.useMemo(() => createDayStyles(colors), [colors]);
  return (
    <View style={dStyles.container}>
      <View style={dStyles.header}>
        <Text style={dStyles.day}>{day}</Text>
        <Text style={dStyles.date}>{date}</Text>
      </View>
      {sessions.map(s => (
        <SessionCard
          key={s.id}
          session={s}
          overrides={getOverridesForSession(s.id)}
          colors={colors}
        />
      ))}
    </View>
  );
}

const createDayStyles = (colors: any) => StyleSheet.create({
  container: { marginBottom: 26 },
  header: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12, gap: 10 },
  day: { fontSize: 20, fontWeight: '900', color: colors.textTitle, letterSpacing: -0.3 },
  date: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const { overrides, getOverridesForSession, resetAll, colors } = useApp();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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
          colors={[colors.heroGrad1, colors.heroGrad2]}
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
            <View style={[styles.summaryCard, totalOverrides > 0 && { borderColor: colors.warning + '40' }]}>
              <Text style={[styles.summaryNum, { color: totalOverrides > 0 ? colors.warning : colors.success }]}>
                {totalOverrides}
              </Text>
              <Text style={styles.summaryLabel}>Adjustments</Text>
            </View>
            <View style={[styles.summaryCard, playersAffected > 0 && { borderColor: colors.danger + '40' }]}>
              <Text style={[styles.summaryNum, { color: playersAffected > 0 ? colors.danger : colors.success }]}>
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
              colors={colors}
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

const createStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBase },
  scroll: { flex: 1 },
  hero: { paddingTop: Platform.OS === 'android' ? 16 : 12, paddingBottom: 22, paddingHorizontal: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: colors.heroEyebrow, letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: colors.textTitle, letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: colors.textSub, marginTop: 6 },
  resetBtn: {
    backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  resetText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  content: { padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderBase,
  },
  summaryNum: { fontSize: 26, fontWeight: '900', color: colors.textTitle, letterSpacing: -0.5 },
  summaryLabel: { fontSize: 10, color: colors.textSub, marginTop: 4, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  infoBanner: {
    flexDirection: 'row', backgroundColor: colors.warning + '10', borderRadius: 13, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: colors.warning + '20', alignItems: 'flex-start', gap: 10,
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: { fontSize: 13, color: colors.textSub, lineHeight: 20, flex: 1 },
  legendCard: {
    backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.borderBase, marginBottom: 30,
  },
  legendTitle: { fontSize: 10, fontWeight: '900', color: colors.textSub, marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
});

const createCardStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.bgCardAlt, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.borderSubtle, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  icon: { fontSize: 22, marginRight: 12, marginTop: 1 },
  headerInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: colors.textTitle, letterSpacing: 0.1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  time: { fontSize: 13, color: colors.textSub, fontWeight: '600' },
  dot: { color: colors.textMuted, fontSize: 10 },
  duration: { fontSize: 13, color: colors.textSub, fontWeight: '600' },
  typeBadge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, marginLeft: 4 },
  typeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  participantLabel: { fontSize: 14 },
  participantText: { fontSize: 13, color: colors.textSub, fontWeight: '600' },
  notes: { fontSize: 12, color: colors.textMuted, lineHeight: 20, marginTop: 4 },
  overridesSection: {
    marginTop: 14, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 12,
  },
  overridesTitle: { fontSize: 12, fontWeight: '800', color: colors.warning, marginBottom: 10, letterSpacing: 0.3 },
  overrideRow: { marginBottom: 10 },
  overrideHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  overridePlayerBadge: {
    backgroundColor: colors.info + '20', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.info + '30',
  },
  overridePlayerText: { color: colors.info, fontSize: 11, fontWeight: '800' },
  overrideScenBadge: {
    backgroundColor: colors.danger + '18', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.danger + '30',
  },
  overrideScenText: { color: colors.danger, fontSize: 10, fontWeight: '800' },
  replacementCard: {
    flexDirection: 'row', backgroundColor: colors.bgDropdown, borderRadius: 11, padding: 12,
    borderWidth: 1, borderColor: colors.warning + '25', gap: 10,
  },
  replacementIcon: { fontSize: 20, marginTop: 2 },
  replacementTitle: { fontSize: 14, fontWeight: '800', color: colors.warning },
  replacementMeta: { fontSize: 12, color: colors.textSub, marginTop: 2 },
  replacementNotes: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
});
