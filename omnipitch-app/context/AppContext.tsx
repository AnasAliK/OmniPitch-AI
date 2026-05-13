import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type PlayerOverride } from '@/data/schedule';
import { generateInterventionSessions } from '@/data/schedule';
import { TEAMS, analyzePlayer, type Player, type TeamData } from '@/data/team';

// ─── Context Types ──────────────────────────────────────────────────────────

interface AppState {
  /** The currently selected team's ID */
  selectedTeamId: string;
  /** The currently selected team data object */
  selectedTeam: TeamData;
  /** Switch the active team */
  switchTeam: (teamId: string) => void;
  /** Per-player intervention overrides keyed by playerId */
  overrides: Record<string, PlayerOverride[]>;
  /** Apply an intervention for a player — generates schedule overrides */
  applyIntervention: (player: Player) => void;
  /** Reset a single player's intervention */
  resetIntervention: (playerId: string) => void;
  /** Reset all interventions */
  resetAll: () => void;
  /** Check if a player has an active intervention */
  hasIntervention: (playerId: string) => boolean;
  /** Get overrides for a specific original session ID */
  getOverridesForSession: (originalSessionId: string) => PlayerOverride[];
}

const AppContext = createContext<AppState | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(TEAMS[0].id);
  const [overrides, setOverrides] = useState<Record<string, PlayerOverride[]>>({});

  const selectedTeam = TEAMS.find(t => t.id === selectedTeamId) || TEAMS[0];

  const switchTeam = useCallback((teamId: string) => {
    setSelectedTeamId(teamId);
    setOverrides({}); // Reset interventions when switching teams
  }, []);

  const applyIntervention = useCallback((player: Player) => {
    const analysis = analyzePlayer(player);
    if (!analysis.hasIssue) return;

    const { replacements } = generateInterventionSessions(
      analysis.category,
      player.shortName,
      analysis.intervention.primary,
      analysis.intervention.secondary,
    );

    const playerOverrides: PlayerOverride[] = replacements.map(r => ({
      playerId: player.id,
      playerName: player.shortName,
      originalSessionId: r.originalId,
      replacementSession: r.session,
      reason: analysis.reasoning,
      scenarioLabel: analysis.title,
      appliedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    setOverrides(prev => ({
      ...prev,
      [player.id]: playerOverrides,
    }));
  }, []);

  const resetIntervention = useCallback((playerId: string) => {
    setOverrides(prev => {
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setOverrides({});
  }, []);

  const hasIntervention = useCallback((playerId: string) => {
    return (overrides[playerId]?.length ?? 0) > 0;
  }, [overrides]);

  const getOverridesForSession = useCallback((originalSessionId: string) => {
    const all: PlayerOverride[] = [];
    Object.values(overrides).forEach(playerOverrides => {
      playerOverrides.forEach(o => {
        if (o.originalSessionId === originalSessionId) {
          all.push(o);
        }
      });
    });
    return all;
  }, [overrides]);

  return (
    <AppContext.Provider value={{
      selectedTeamId,
      selectedTeam,
      switchTeam,
      overrides,
      applyIntervention,
      resetIntervention,
      resetAll,
      hasIntervention,
      getOverridesForSession,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
