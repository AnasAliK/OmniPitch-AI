// ─── OmniPitch Dynamic Analysis Engine ──────────────────────────────────────
// No hardcoded scenarios — anomalies are detected from stat baselines automatically.

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';
export type PlayerStatus = 'Active' | 'Technical Focus' | 'Recovery' | 'Tactical Review';

export interface PlayerStats {
  matchCount: number;
  minutesPlayed: number;
  goals: number;
  xG: number;
  xA: number;
  assists: number;
  shotsTotal: number;
  shotsOnTarget: number;
  groundDuelsWon: number;
  groundDuelsTotal: number;
  passingAccuracy: number;
  savePercentage?: number;
  goalsConceded?: number;
  counterGoalsConceded?: number;
  heatmapCoverage: 'Wide' | 'Normal' | 'Contracted';
  sprintDistance: 'High' | 'Normal' | 'Low';
}

export interface Player {
  id: string;
  name: string;
  shortName: string;
  number: number;
  position: Position;
  nationality: string;
  age: number;
  stats: PlayerStats;
  status: PlayerStatus;
  avatarInitials: string;
  avatarColor: string;
  imageUrl?: string;
}

export interface TeamData {
  name: string;
  shortName: string;
  league: string;
  season: string;
  manager: string;
  lastScrapedAt?: string;
  players: Player[];
}

// ─── Anomaly Detection ─────────────────────────────────────────────────────

export interface Anomaly {
  metric: string;
  actual: string;
  baseline: string;
  deviation: 'below' | 'above';
  severity: number; // 0-1
}

export type IssueCategory = 'Technical' | 'Physical' | 'Tactical' | 'None';

export interface AnalysisResult {
  hasIssue: boolean;
  category: IssueCategory;
  title: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasoning: string;
  anomalies: Anomaly[];
  intervention: {
    primary: string;
    secondary: string;
    duration: string;
    statusChange: PlayerStatus;
  };
  indicators: { label: string; value: string; color: string }[];
}

// ─── Position-Specific Baselines ────────────────────────────────────────────

export interface Baseline {
  minConversion?: number;
  maxXgGap?: number;
  minDuelRate: number;
  minPassAcc: number;
  maxMinsPerGame: number;
  minSavePct?: number;
  maxCounterGoals?: number;
}

export function getBaseline(pos: Position): Baseline {
  const attacking = ['ST', 'LW', 'RW', 'CAM'].includes(pos);
  const midfield = ['CM', 'CDM'].includes(pos);
  const defense = ['CB', 'LB', 'RB'].includes(pos);
  const gk = pos === 'GK';

  return {
    minConversion: attacking ? 0.08 : undefined,
    maxXgGap: attacking ? 1.5 : undefined,
    minDuelRate: defense ? 0.50 : midfield ? 0.45 : 0.40,
    minPassAcc: midfield || gk ? 85 : defense ? 82 : 75,
    maxMinsPerGame: 88,
    minSavePct: gk ? 62 : undefined,
    maxCounterGoals: gk ? 2 : undefined,
  };
}

// ─── AI Analysis Cache ────────────────────────────────────────────────────────
let cachedAiAnalysis: Record<string, AnalysisResult> = {};

export function setCachedAnalysis(analysisData: Record<string, AnalysisResult>) {
  cachedAiAnalysis = analysisData;
}

// ─── Core Analysis Function ─────────────────────────────────────────────────

export function analyzePlayer(player: Player): AnalysisResult {
  if (cachedAiAnalysis[player.id]) {
    return cachedAiAnalysis[player.id];
  }

  const s = player.stats;
  const baseline = getBaseline(player.position);
  const anomalies: Anomaly[] = [];

  const minsPerGame = s.matchCount > 0 ? s.minutesPlayed / s.matchCount : 0;
  const convRate = s.shotsTotal > 0 ? s.goals / s.shotsTotal : 0;
  const duelRate = s.groundDuelsTotal > 0 ? s.groundDuelsWon / s.groundDuelsTotal : 1;
  const xgGap = s.xG - s.goals;
  const xgPerGame = s.matchCount > 0 ? s.xG / s.matchCount : 0;

  // ── Detect anomalies automatically ────────────────────────────────────

  // xG-Goals gap (attacking players)
  if (baseline.maxXgGap !== undefined && xgGap >= baseline.maxXgGap && xgPerGame >= 0.4) {
    anomalies.push({
      metric: 'xG Conversion', actual: `${s.goals} goals from ${s.xG} xG`,
      baseline: `Expected ≈${Math.round(s.xG)} goals`, deviation: 'below',
      severity: Math.min(1, xgGap / 3),
    });
  }

  // Conversion rate
  if (baseline.minConversion !== undefined && convRate < baseline.minConversion && s.shotsTotal >= 5) {
    anomalies.push({
      metric: 'Shot Conversion', actual: `${(convRate * 100).toFixed(1)}%`,
      baseline: `>${(baseline.minConversion * 100).toFixed(0)}% expected`, deviation: 'below',
      severity: Math.min(1, (baseline.minConversion - convRate) / baseline.minConversion),
    });
  }

  // Duel win rate
  if (duelRate < baseline.minDuelRate && s.groundDuelsTotal >= 10) {
    anomalies.push({
      metric: 'Duel Win Rate', actual: `${(duelRate * 100).toFixed(0)}%`,
      baseline: `>${(baseline.minDuelRate * 100).toFixed(0)}% expected`, deviation: 'below',
      severity: Math.min(1, (baseline.minDuelRate - duelRate) / baseline.minDuelRate),
    });
  }

  // Minutes overload
  if (minsPerGame > baseline.maxMinsPerGame && s.minutesPlayed >= 250) {
    anomalies.push({
      metric: 'Minutes Load', actual: `${minsPerGame.toFixed(0)}'/game (${s.minutesPlayed} total)`,
      baseline: `<${baseline.maxMinsPerGame}'/game`, deviation: 'above',
      severity: Math.min(1, (minsPerGame - baseline.maxMinsPerGame) / 10),
    });
  }

  // Heatmap contraction
  if (s.heatmapCoverage === 'Contracted') {
    anomalies.push({
      metric: 'Heatmap Coverage', actual: 'Contracted',
      baseline: 'Normal or Wide', deviation: 'below',
      severity: 0.6,
    });
  }

  // Sprint decline
  if (s.sprintDistance === 'Low') {
    anomalies.push({
      metric: 'Sprint Output', actual: 'Low',
      baseline: 'Normal or High', deviation: 'below',
      severity: 0.5,
    });
  }

  // Passing accuracy
  if (s.passingAccuracy < baseline.minPassAcc - 5) {
    anomalies.push({
      metric: 'Passing Accuracy', actual: `${s.passingAccuracy}%`,
      baseline: `>${baseline.minPassAcc}% expected`, deviation: 'below',
      severity: Math.min(1, (baseline.minPassAcc - s.passingAccuracy) / 15),
    });
  }

  // GK: Save percentage
  if (baseline.minSavePct !== undefined && s.savePercentage !== undefined && s.savePercentage < baseline.minSavePct) {
    anomalies.push({
      metric: 'Save Percentage', actual: `${s.savePercentage}%`,
      baseline: `>${baseline.minSavePct}% expected`, deviation: 'below',
      severity: Math.min(1, (baseline.minSavePct - s.savePercentage) / 20),
    });
  }

  // GK: Counter goals
  if (baseline.maxCounterGoals !== undefined && (s.counterGoalsConceded ?? 0) > baseline.maxCounterGoals) {
    anomalies.push({
      metric: 'Counter-Attack Goals', actual: `${s.counterGoalsConceded} conceded`,
      baseline: `≤${baseline.maxCounterGoals} expected`, deviation: 'above',
      severity: Math.min(1, ((s.counterGoalsConceded ?? 0) - baseline.maxCounterGoals) / 3),
    });
  }

  // ── No anomalies ─────────────────────────────────────────────────────
  if (anomalies.length === 0) {
    return {
      hasIssue: false, category: 'None', title: 'No Issues Detected',
      severity: 'none', confidence: 0,
      reasoning: 'All metrics within position-specific baselines.',
      anomalies: [], indicators: [],
      intervention: { primary: 'Continue current program', secondary: 'Standard schedule', duration: 'N/A', statusChange: 'Active' },
    };
  }

  // ── Classify category from anomaly patterns ──────────────────────────
  const hasConversionIssue = anomalies.some(a => a.metric.includes('Conversion') || a.metric.includes('xG'));
  const hasPhysicalIssue = anomalies.some(a => ['Minutes Load', 'Heatmap Coverage', 'Sprint Output', 'Duel Win Rate'].includes(a.metric));
  const hasTacticalIssue = anomalies.some(a => ['Save Percentage', 'Counter-Attack Goals', 'Passing Accuracy'].includes(a.metric));

  const physicalCount = anomalies.filter(a => ['Minutes Load', 'Heatmap Coverage', 'Sprint Output', 'Duel Win Rate'].includes(a.metric)).length;
  const technicalCount = anomalies.filter(a => a.metric.includes('Conversion') || a.metric.includes('xG')).length;
  const tacticalCount = anomalies.filter(a => ['Save Percentage', 'Counter-Attack Goals', 'Passing Accuracy'].includes(a.metric)).length;

  let category: IssueCategory;
  if (physicalCount >= 2 && physicalCount >= technicalCount) category = 'Physical';
  else if (technicalCount >= 1 && hasConversionIssue) category = 'Technical';
  else if (tacticalCount >= 1 && hasTacticalIssue) category = 'Tactical';
  else if (physicalCount >= technicalCount) category = 'Physical';
  else category = 'Technical';

  const avgSeverity = anomalies.reduce((sum, a) => sum + a.severity, 0) / anomalies.length;
  const overallSeverity = avgSeverity >= 0.7 ? 'critical' : avgSeverity >= 0.5 ? 'high' : avgSeverity >= 0.3 ? 'medium' : 'low';
  const confidence = Math.min(96, Math.round(50 + anomalies.length * 10 + avgSeverity * 20));

  // ── Generate dynamic title ────────────────────────────────────────────
  const title = category === 'Technical'
    ? `${category}: Clinical Execution Drop`
    : category === 'Physical'
    ? `${category}: Fatigue & Output Decline`
    : `${category}: Structural Vulnerability`;

  // ── Generate reasoning chain ──────────────────────────────────────────
  const reasonParts = anomalies.map(a => `${a.metric}: ${a.actual} (${a.baseline})`);
  const reasoning = `Detected ${anomalies.length} anomal${anomalies.length > 1 ? 'ies' : 'y'} for ${player.position} baseline. ` + reasonParts.join('. ') + '.';

  // ── Generate intervention dynamically ─────────────────────────────────
  const intervention = generateIntervention(category, anomalies, player);

  // ── Build indicators ──────────────────────────────────────────────────
  const indicators = anomalies.slice(0, 4).map(a => ({
    label: a.metric,
    value: a.actual.split('(')[0].trim(),
    color: a.severity >= 0.6 ? '#ef4444' : a.severity >= 0.3 ? '#f59e0b' : '#10b981',
  }));

  return { hasIssue: true, category, title, severity: overallSeverity, confidence, reasoning, anomalies, indicators, intervention };
}

function generateIntervention(category: IssueCategory, anomalies: Anomaly[], player: Player) {
  const metrics = anomalies.map(a => a.metric);
  const isGK = player.position === 'GK';
  const isDef = ['CB', 'LB', 'RB'].includes(player.position);
  
  if (category === 'Technical') {
    if (metrics.includes('xG Conversion') || metrics.includes('Shot Conversion')) {
      return {
        primary: `Clinical Finishing & 1v1 Drills for ${player.position}`,
        secondary: 'Video analysis: Reviewing shot selection & keeper positioning',
        duration: '48h Technical Focus Block',
        statusChange: 'Technical Focus' as PlayerStatus,
      };
    }
    if (metrics.includes('Passing Accuracy')) {
      return {
        primary: 'Distribution & Playmaking Under Pressure',
        secondary: 'Rondo sessions with constrained touches',
        duration: '48h Distribution Block',
        statusChange: 'Technical Focus' as PlayerStatus,
      };
    }
    return {
      primary: 'Core Technical Mechanics Review',
      secondary: 'Individual skill refinement session with coaches',
      duration: '48h Technical Focus Block',
      statusChange: 'Technical Focus' as PlayerStatus,
    };
  }

  if (category === 'Physical') {
    if (metrics.includes('Minutes Load')) {
      return {
        primary: 'Load Reduction & Hydrotherapy',
        secondary: 'Complete rest from high-intensity interval training',
        duration: '72h Recovery Protocol',
        statusChange: 'Recovery' as PlayerStatus,
      };
    }
    if (metrics.includes('Sprint Output') || metrics.includes('Heatmap Coverage')) {
      return {
        primary: 'Conditioning Assessment & Light Aerobic Work',
        secondary: 'Physio evaluation for underlying fatigue or minor strain',
        duration: '48h Active Recovery',
        statusChange: 'Recovery' as PlayerStatus,
      };
    }
    if (metrics.includes('Duel Win Rate')) {
      return {
        primary: 'Strength & Core Stability Focus',
        secondary: 'Gym session targeting lower body power and balance',
        duration: '48h Physical Conditioning',
        statusChange: 'Recovery' as PlayerStatus,
      };
    }
  }

  // Tactical
  if (isGK && (metrics.includes('Save Percentage') || metrics.includes('Counter-Attack Goals'))) {
    return {
      primary: 'Shot Stopping & 1v1 Positioning',
      secondary: 'Goalkeeper-specific video analysis on starting positions',
      duration: '24h Tactical GK Review',
      statusChange: 'Tactical Review' as PlayerStatus,
    };
  }
  if (isDef && metrics.includes('Duel Win Rate')) {
    return {
      primary: 'Defensive Positioning & 1v1 Defending',
      secondary: 'Shape review with defensive unit against overloaded attacks',
      duration: '24h Defensive Shape Block',
      statusChange: 'Tactical Review' as PlayerStatus,
    };
  }
  
  return {
    primary: 'Positional Shape & Spatial Awareness',
    secondary: `Video session analyzing ${player.position} positional responsibilities`,
    duration: '24h Tactical Focus Block',
    statusChange: 'Tactical Review' as PlayerStatus,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getPositionColor(position: Position): string {
  switch (position) {
    case 'GK': return '#f59e0b';
    case 'CB': case 'LB': case 'RB': return '#3b82f6';
    case 'CDM': case 'CM': case 'CAM': return '#10b981';
    case 'LW': case 'RW': case 'ST': return '#ef4444';
    default: return '#64748b';
  }
}

export function getCategoryColor(cat: IssueCategory): string {
  switch (cat) {
    case 'Technical': return '#ef4444';
    case 'Physical': return '#f59e0b';
    case 'Tactical': return '#8b5cf6';
    default: return '#10b981';
  }
}

import teamsData from './teams.json';

// We export the array of teams, properly typed
export const TEAMS: TeamData[] = teamsData as TeamData[];

// For backwards compatibility during transition, we can still export a default TEAM
// though the UI should now use AppContext to select the active team.
export const TEAM: TeamData = TEAMS[0];
