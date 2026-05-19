// ─── OmniPitch Schedule Data & Types ────────────────────────────────────────

export interface PracticeSession {
  id: string;
  day: string;        // e.g. "Thursday", "Friday"
  date: string;       // e.g. "May 15"
  time: string;       // e.g. "10:00 AM"
  title: string;
  type: 'team' | 'positional' | 'recovery' | 'tactical' | 'individual';
  duration: string;   // e.g. "90 mins"
  icon: string;
  participants: 'Full Squad' | 'Attackers' | 'Defenders' | 'Midfielders' | 'Goalkeepers' | string;
  notes?: string;
}

export interface PlayerOverride {
  playerId: string;
  playerName: string;
  originalSessionId: string;
  replacementSession: PracticeSession;
  reason: string;
  scenarioLabel: string;
  appliedAt: string;
}

// ─── Default 7-Day Team Schedule (Coach's planned sessions) ───────────────────

export const DEFAULT_SCHEDULE: PracticeSession[] = [
  {
    id: 'mon-morning', day: 'Monday', date: 'May 12', time: '10:00 AM',
    title: 'Match Review & Recovery', type: 'recovery', duration: '60 mins',
    icon: '🧘', participants: 'Full Squad',
    notes: 'Video analysis of previous match. Light pool recovery for starters.',
  },
  {
    id: 'tue-morning', day: 'Tuesday', date: 'May 13', time: '10:30 AM',
    title: 'High-Intensity Conditioning', type: 'individual', duration: '75 mins',
    icon: '🏃', participants: 'Full Squad',
    notes: 'Sprints, VO2 max testing, and small-sided games (3v3).',
  },
  {
    id: 'wed-morning', day: 'Wednesday', date: 'May 14', time: '10:00 AM',
    title: 'Positional Play & Patterns', type: 'positional', duration: '90 mins',
    icon: '🔄', participants: 'Midfielders & Attackers',
    notes: 'Attacking third combinations and crossing drills.',
  },
  {
    id: 'wed-gk', day: 'Wednesday', date: 'May 14', time: '10:00 AM',
    title: 'GK: Crosses & Sweeping', type: 'positional', duration: '90 mins',
    icon: '🧤', participants: 'Goalkeepers',
    notes: 'Handling high balls and sweeping behind a high line.',
  },
  {
    id: 'thu-morning', day: 'Thursday', date: 'May 15', time: '10:00 AM',
    title: 'Team Tactical Session', type: 'team', duration: '90 mins',
    icon: '⚽', participants: 'Full Squad',
    notes: 'Focus on pressing patterns and build-up play from the back.',
  },
  {
    id: 'thu-afternoon', day: 'Thursday', date: 'May 15', time: '02:00 PM',
    title: 'Defensive Shape', type: 'tactical', duration: '60 mins',
    icon: '🛡️', participants: 'Defenders',
    notes: 'Low block organization and shifting as a unit.',
  },
  {
    id: 'fri-morning', day: 'Friday', date: 'May 16', time: '10:00 AM',
    title: 'Match Day -1: Set Pieces', type: 'tactical', duration: '75 mins',
    icon: '📐', participants: 'Full Squad',
    notes: 'Corners, free kicks. Walkthrough of opponent set-piece threats.',
  },
  {
    id: 'sat-morning', day: 'Saturday', date: 'May 17', time: '09:00 AM',
    title: 'Pre-Match Walkthrough', type: 'tactical', duration: '30 mins',
    icon: '📋', participants: 'Full Squad',
    notes: 'Final tactical briefing, shape review, and dead-ball assignments.',
  },
  {
    id: 'sun-afternoon', day: 'Sunday', date: 'May 18', time: '01:00 PM',
    title: 'Match Day', type: 'team', duration: '120 mins',
    icon: '🏟️', participants: 'Matchday Squad',
    notes: 'Official Fixture.',
  },
];

// ─── Generate Intervention Sessions ─────────────────────────────────────────

export function generateInterventionSessions(
  category: string,
  playerName: string,
  decideSummary: string,
  aiInterventions?: any[]
): { replacements: { originalId: string; session: PracticeSession }[] } {

  if (aiInterventions && aiInterventions.length > 0) {
    const iconMap: Record<string, string> = {
      water: '💧',
      brain: '🧠',
      cone: '⚠️',
      barbell: '🏋️',
      target: '🎯'
    };

    return {
      replacements: aiInterventions.map((inv, idx) => {
        const dayPrefix = inv.schedule_day.substring(0, 3).toLowerCase();
        const timeLower = inv.schedule_time.toLowerCase();
        const isPm = timeLower.includes('pm');
        const isAfternoon = isPm && !timeLower.startsWith('12');
        const originalId = `${dayPrefix}-${isAfternoon ? 'afternoon' : 'morning'}`;

        return {
          originalId,
          session: {
            id: `int-${Date.now()}-${idx}`,
            day: inv.schedule_day,
            date: 'May 15', // dynamically calculated later or static representation
            time: inv.schedule_time,
            title: inv.title,
            type: category.toLowerCase() as any,
            duration: `${inv.duration_mins} mins`,
            icon: iconMap[inv.icon_type] || '🤖',
            participants: playerName,
            notes: decideSummary,
          }
        };
      })
    };
  }

  switch (category) {
    case 'Technical':
      return {
        replacements: [
          {
            originalId: 'thu-morning',
            session: {
              id: `int-${Date.now()}-1`,
              day: 'Thursday',
              date: 'May 15',
              time: '10:00 AM',
              title: 'Near-post Finishing Drills',
              type: 'individual',
              duration: '45 mins',
              icon: '🎯',
              participants: playerName,
              notes: '1v1 finishing, near-post angles, composure drills with Striker Coach.',
            },
          },
          {
            originalId: 'thu-afternoon',
            session: {
              id: `int-${Date.now()}-2`,
              day: 'Thursday',
              date: 'May 15',
              time: '02:00 PM',
              title: 'Video Analysis: Missed Chances',
              type: 'individual',
              duration: '30 mins',
              icon: '📹',
              participants: playerName,
              notes: 'Review of last 3 games missed opportunities with coaching staff.',
            },
          },
          {
            originalId: 'fri-morning',
            session: {
              id: `int-${Date.now()}-3`,
              day: 'Friday',
              date: 'May 16',
              time: '10:00 AM',
              title: 'Pressure Finishing (Small-Sided)',
              type: 'individual',
              duration: '45 mins',
              icon: '⚽',
              participants: playerName,
              notes: 'Finishing under defensive pressure in tight spaces.',
            },
          },
        ],
      };

    case 'Physical':
      return {
        replacements: [
          {
            originalId: 'thu-morning',
            session: {
              id: `int-${Date.now()}-1`,
              day: 'Thursday',
              date: 'May 15',
              time: '10:00 AM',
              title: 'Hydrotherapy & Pool Recovery',
              type: 'recovery',
              duration: '40 mins',
              icon: '💧',
              participants: playerName,
              notes: 'Contrast baths, pool walking. No high-intensity work.',
            },
          },
          {
            originalId: 'thu-afternoon',
            session: {
              id: `int-${Date.now()}-2`,
              day: 'Thursday',
              date: 'May 15',
              time: '03:00 PM',
              title: 'Massage & Sports Therapy',
              type: 'recovery',
              duration: '30 mins',
              icon: '🧘',
              participants: playerName,
              notes: 'Deep tissue massage and mobility work with physio team.',
            },
          },
          {
            originalId: 'fri-morning',
            session: {
              id: `int-${Date.now()}-3`,
              day: 'Friday',
              date: 'May 16',
              time: '10:30 AM',
              title: 'Light Activation Only',
              type: 'recovery',
              duration: '25 mins',
              icon: '🚶',
              participants: playerName,
              notes: 'Yoga, light stretching. Exempt from set-piece session.',
            },
          },
        ],
      };

    case 'Tactical':
      return {
        replacements: [
          {
            originalId: 'thu-gk',
            session: {
              id: `int-${Date.now()}-1`,
              day: 'Thursday',
              date: 'May 15',
              time: '02:00 PM',
              title: 'Counter-Attack Defensive Drill',
              type: 'tactical',
              duration: '60 mins',
              icon: '🛡️',
              participants: `${playerName} + Defenders`,
              notes: 'Simulate counter-attack scenarios. Focus on defensive line communication.',
            },
          },
          {
            originalId: 'fri-morning',
            session: {
              id: `int-${Date.now()}-2`,
              day: 'Friday',
              date: 'May 16',
              time: '09:00 AM',
              title: 'Tactical Video: Defensive Line Height',
              type: 'tactical',
              duration: '45 mins',
              icon: '📹',
              participants: `${playerName} + Defensive Unit`,
              notes: 'Review opposition counter-attack patterns and adjust line height.',
            },
          },
        ],
      };

    default:
      return { replacements: [] };
  }
}
