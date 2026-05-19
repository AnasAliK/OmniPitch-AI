require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Map Country codes to emoji flags
function getEmojiFlag(ccode) {
  const flags = { 'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'NOR': '🇳🇴', 'BRA': '🇧🇷', 'ESP': '🇪🇸', 'BEL': '🇧🇪', 'POR': '🇵🇹', 'FRA': '🇫🇷', 'ARG': '🇦🇷', 'NED': '🇳🇱', 'SUI': '🇨🇭', 'CRO': '🇭🇷', 'EGY': '🇪🇬' };
  return flags[ccode] || null;
}

// Fetch and scrape a specific team by ID
async function scrapeTeam(teamId, teamName) {
  console.log(`Starting Playwright scraping for ${teamName} (ID: ${teamId})...`);
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge'
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const pageUrl = `https://www.fotmob.com/teams/${teamId}/squad/`;
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const nextDataStr = await page.evaluate(() => {
      const script = document.getElementById('__NEXT_DATA__');
      return script ? script.innerText : null;
    });

    if (!nextDataStr) {
      throw new Error(`Failed to find __NEXT_DATA__ for ${teamName}`);
    }

    const nextData = JSON.parse(nextDataStr);
    const fallbackKey = `team-${teamId}`;
    const teamData = nextData.props?.pageProps?.fallback?.[fallbackKey];

    if (teamData && teamData.squad && teamData.squad.squad) {
      const squadGroups = teamData.squad.squad;
      const players = [];

      squadGroups.forEach(group => {
        if (group.title === 'coach') return;

        group.members.forEach(m => {
          let pos = 'CM';
          if (group.title === 'keepers') pos = 'GK';
          else if (group.title === 'defenders') pos = m.positionIdsDesc?.includes('B') ? m.positionIdsDesc : 'CB';
          else if (group.title === 'midfielders') pos = m.positionIdsDesc?.includes('M') ? m.positionIdsDesc : 'CM';
          else if (group.title === 'attackers') pos = m.positionIdsDesc?.includes('W') ? m.positionIdsDesc : 'ST';
          if (!pos || pos.length > 3) pos = group.title === 'attackers' ? 'ST' : 'CM';

          const matchCount = 5;
          const minutes = pos === 'GK' ? 450 : Math.floor(Math.random() * 400 + 50);
          const isAttacker = pos === 'ST' || pos === 'RW' || pos === 'LW';
          const isDefender = pos === 'CB' || pos === 'RB' || pos === 'LB';

          const goals = isAttacker ? Math.floor(Math.random() * 5) : (isDefender ? 0 : Math.floor(Math.random() * 2));

          players.push({
            id: String(m.id),
            name: m.name,
            shortName: m.name.split(' ').pop(),
            number: m.shirtNumber || Math.floor(Math.random() * 99) + 1,
            position: pos,
            nationality: getEmojiFlag(m.ccode) || m.cname,
            age: m.age || 25,
            avatarInitials: m.name.substring(0, 2).toUpperCase(),
            avatarColor: group.title === 'keepers' ? '#f59e0b' : (isDefender ? '#3b82f6' : (isAttacker ? '#ef4444' : '#10b981')),
            status: 'Active',
            stats: {
              matchCount,
              minutesPlayed: minutes,
              goals: goals,
              xG: +(goals + (Math.random() * 1.5 - 0.5)).toFixed(2),
              xA: +(Math.random() * 2).toFixed(2),
              assists: Math.floor(Math.random() * 3),
              shotsTotal: isAttacker ? Math.floor(Math.random() * 15 + 5) : Math.floor(Math.random() * 5),
              shotsOnTarget: isAttacker ? Math.floor(Math.random() * 8 + 2) : Math.floor(Math.random() * 2),
              groundDuelsWon: Math.floor(Math.random() * 20 + 5),
              groundDuelsTotal: Math.floor(Math.random() * 40 + 15),
              passingAccuracy: Math.floor(Math.random() * 20 + 75),
              heatmapCoverage: Math.random() > 0.7 ? 'Contracted' : (Math.random() > 0.5 ? 'Wide' : 'Normal'),
              sprintDistance: Math.random() > 0.7 ? 'Low' : (Math.random() > 0.5 ? 'High' : 'Normal'),
              ...(pos === 'GK' && {
                savePercentage: Math.floor(Math.random() * 40 + 50),
                goalsConceded: Math.floor(Math.random() * 8),
                counterGoalsConceded: Math.floor(Math.random() * 3),
              })
            }
          });
        });
      });

      const result = {
        id: String(teamId),
        name: teamName,
        shortName: teamName.substring(0, 3).toUpperCase(),
        manager: squadGroups.find(g => g.title === 'coach')?.members?.[0]?.name || 'Manager',
        league: 'Premier League',
        season: '2025/26',
        lastScrapedAt: new Date().toISOString(),
        players: players
      };

      await browser.close();
      return result;

    } else {
      await browser.close();
      throw new Error(`'squad' missing in extracted state for ${teamName}`);
    }
  } catch (error) {
    await browser.close();
    throw error;
  }
}

app.get('/api/scrape/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const teamsMap = {
      '8456': 'Manchester City',
      '9825': 'Arsenal',
      '8650': 'Liverpool',
      '8455': 'Chelsea',
      '10260': 'Manchester United',
      '8586': 'Tottenham Hotspur',
      '10252': 'Aston Villa',
      '10261': 'Newcastle United',
      '10204': 'Brighton & Hove Albion',
      '8654': 'West Ham United',
      '8602': 'Wolverhampton Wanderers',
      '9879': 'Fulham',
      '9826': 'Crystal Palace',
      '8678': 'AFC Bournemouth',
      '8668': 'Everton',
      '9937': 'Brentford',
      '10203': 'Nottingham Forest',
      '8197': 'Leicester City',
      '9902': 'Ipswich Town',
      '8460': 'Southampton'
    };

    const teamName = teamsMap[teamId] || 'Unknown Team';
    const teamData = await scrapeTeam(teamId, teamName);

    res.json(teamData);
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agent/intervention', async (req, res) => {
  try {
    const { player } = req.body;
    const prompt = `You are an Elite Football Data Analyst AI agent working for a top-tier Champions League club.
Your task is to analyze this specific player's stats and detect vulnerabilities against positional baselines, then make a highly creative, cutting-edge intervention.
DO NOT use generic training sessions (like "Finishing Drills"). You must suggest hyper-modern interventions (e.g., "VR Cognitive Scanning", "Neuro-plasticity Reaction Training", "Bio-band Sleep Cycle Reset").

Generate this exact JSON structure (NOT an array, just the object):
{
  "playerId": "string",
  "hasIssue": true,
  "category": "Technical" | "Physical" | "Tactical",
  "title": "string (e.g., 'Physical: Fatigue & Output Decline')",
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": number (0-100),
  "reasoning": "string (Explain exactly which stats caused this vulnerability and why)",
  "anomalies": [
    { "metric": "string", "actual": "string", "baseline": "string", "deviation": "below" | "above", "severity": number (0-1) }
  ],
  "indicators": [
    { "label": "string", "value": "string", "color": "string (hex color, e.g., #ef4444 for bad, #f59e0b for warning)" }
  ],
  "intervention": {
    "primary": "string (Title of the specific training session to fix this vulnerability)",
    "secondary": "string (Description of the session)",
    "duration": "string (e.g., '48h Recovery Protocol')",
    "statusChange": "Technical Focus" | "Recovery" | "Tactical Review"
  }
}

Player Data:
${JSON.stringify({
      id: player.id,
      name: player.name,
      position: player.position,
      stats: player.stats
    }, null, 2)}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    res.json(analysis);
  } catch (error) {
    console.error("Agent API error (Intervention):", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agent/scenarios', async (req, res) => {
  try {
    const { players } = req.body;
    const prompt = `You are an Elite Football Data Analyst AI agent.
Analyze this team's players and identify 2-3 macro-scenarios (Technical, Physical, or Tactical issues) affecting multiple players.

Generate this exact JSON structure:
{
  "scenarios": [
    {
      "category": "Technical" | "Physical" | "Tactical",
      "icon": "string (emoji)",
      "players": [
        {
          "player": { "id": "string", "name": "string", "avatarInitials": "string", "avatarColor": "string", "position": "string" },
          "analysis": {
            "hasIssue": true,
            "category": "Technical" | "Physical" | "Tactical",
            "title": "string",
            "severity": "low" | "medium" | "high" | "critical",
            "confidence": number,
            "reasoning": "string",
            "anomalies": [{ "metric": "string", "actual": "string", "baseline": "string", "deviation": "below" | "above", "severity": number }],
            "indicators": [{ "label": "string", "value": "string", "color": "string" }],
            "intervention": {
              "primary": "string",
              "secondary": "string",
              "duration": "string",
              "statusChange": "Technical Focus" | "Recovery" | "Tactical Review"
            }
          }
        }
      ]
    }
  ]
}

Team Players Data:
${JSON.stringify(players.map(p => ({
      id: p.id,
      name: p.name,
      avatarInitials: p.avatarInitials,
      avatarColor: p.avatarColor,
      position: p.position,
      stats: p.stats
    })), null, 2)}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json(result.scenarios);
  } catch (error) {
    console.error("Agent API error (Scenarios):", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
