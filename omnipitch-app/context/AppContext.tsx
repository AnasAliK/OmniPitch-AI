import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { type PlayerOverride } from '@/data/schedule';
import { generateInterventionSessions } from '@/data/schedule';
import { TEAMS, analyzePlayer, setCachedAnalysis, addCachedAnalysis, type Player, type TeamData, type AnalysisResult } from '@/data/team';
import { Colors } from '@/constants/theme';

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
  isLoadingTeam: boolean;
  generateAiIntervention: (player: Player) => Promise<AnalysisResult | null>;
  generateAiScenarios: (players: Player[]) => Promise<any[] | null>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colors: typeof Colors.light;
}

const AppContext = createContext<AppState | null>(null);

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(TEAMS[0].id);
  const [overrides, setOverrides] = useState<Record<string, PlayerOverride[]>>({});
  const [teamsDataState, setTeamsDataState] = useState<TeamData[]>(TEAMS);
  const [isLoadingTeam, setIsLoadingTeam] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const currentColors = Colors[theme];

  const selectedTeam = teamsDataState.find(t => t.id === selectedTeamId) || teamsDataState[0];

  const switchTeam = useCallback(async (teamId: string) => {
    setSelectedTeamId(teamId);
    setOverrides({}); // Reset interventions when switching teams
    setCachedAnalysis({}); // Clear AI cache when switching teams
    
    // Attempt real-time fetch from local server
    setIsLoadingTeam(true);
    try {
      let serverUrl = 'http://localhost:3000';
      if (Constants.expoConfig?.hostUri) {
        // hostUri looks like '192.168.1.100:8081'
        const ip = Constants.expoConfig.hostUri.split(':')[0];
        serverUrl = `http://${ip}:3000`;
      } else if (Platform.OS === 'android') {
        serverUrl = 'http://10.0.2.2:3000';
      }
      
      const response = await fetch(`${serverUrl}/api/scrape/${teamId}`);
      if (response.ok) {
        const teamData = await response.json();
        
        // Save the team data
        setTeamsDataState(prev => {
          const newTeams = [...prev];
          const idx = newTeams.findIndex(t => t.id === teamId);
          if (idx !== -1) {
            newTeams[idx] = teamData;
          } else {
            newTeams.push(teamData);
          }
          return newTeams;
        });
      } else {
        console.warn('Local scraper server responded with an error. Using cached data.');
      }
    } catch (error) {
      console.warn('Could not connect to local scraper server. Ensure node server.js is running. Using cached data.', error);
    } finally {
      setIsLoadingTeam(false);
    }
  }, []);

  useEffect(() => {
    // Trigger initial scrape on app start
    switchTeam(TEAMS[0].id);
  }, [switchTeam]);

  const applyIntervention = useCallback((player: Player) => {
    const analysis = analyzePlayer(player);
    if (!analysis.hasIssue) return;

    const { replacements } = generateInterventionSessions(
      analysis.scenario_tab.category,
      player.shortName,
      analysis.ooda_trace.decide_summary,
      analysis.interventions
    );

    const playerOverrides: PlayerOverride[] = replacements.map(r => ({
      playerId: player.id,
      playerName: player.shortName,
      originalSessionId: r.originalId,
      replacementSession: r.session,
      reason: analysis.ooda_trace.orient_summary,
      scenarioLabel: analysis.scenario_tab.anomaly_title,
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

  const generateAiIntervention = useCallback(async (player: Player) => {
    try {
      let serverUrl = 'http://localhost:3000';
      if (Constants.expoConfig?.hostUri) {
        const ip = Constants.expoConfig.hostUri.split(':')[0];
        serverUrl = `http://${ip}:3000`;
      } else if (Platform.OS === 'android') {
        serverUrl = 'http://10.0.2.2:3000';
      }
      const response = await fetch(`${serverUrl}/api/agent/intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player }),
      });
      if (response.ok) {
        const analysis = await response.json();
        addCachedAnalysis(player.id, analysis);
        return analysis as AnalysisResult;
      }
    } catch (e) {
      console.error('Groq Intervention API error', e);
    }
    return null;
  }, []);

  const generateAiScenarios = useCallback(async (players: Player[]) => {
    try {
      let serverUrl = 'http://localhost:3000';
      if (Constants.expoConfig?.hostUri) {
        const ip = Constants.expoConfig.hostUri.split(':')[0];
        serverUrl = `http://${ip}:3000`;
      } else if (Platform.OS === 'android') {
        serverUrl = 'http://10.0.2.2:3000';
      }
      const response = await fetch(`${serverUrl}/api/agent/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.error('Groq Scenarios API error', e);
    }
    return null;
  }, []);

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
      isLoadingTeam,
      generateAiIntervention,
      generateAiScenarios,
      theme,
      toggleTheme,
      colors: currentColors,
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
