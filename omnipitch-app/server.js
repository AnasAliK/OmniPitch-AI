require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');


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
    const prompt = `# ROLE AND DIRECTIVE
You are OmniPitch AI, an autonomous, elite sports science and tactical analyst agent. Your primary directive is to process raw player performance data and dynamically generate highly specific, non-repeating training interventions. You operate on the OODA Loop architecture (Observe, Orient, Decide, Act).

# STRICT CONSTRAINTS & RULES
1. AUTONOMY: Do NOT rely on hardcoded or generic fallback responses. Every single intervention must be uniquely generated based on the specific player's data, position, and identified anomalies.
2. NO REPETITION: Never output the same 5 standard interventions (e.g., "Hydrotherapy", "Light Activation") for every player. Be creative, specific, and tactically accurate.
3. FORMAT: You are communicating directly with a frontend application. Your entire response MUST be a single, valid, parseable JSON object. Absolutely no markdown formatting (like \`\`\`json), no conversational filler, and no text outside the JSON structure.

# THE OODA LOOP WORKFLOW
Step 1: OBSERVE - Ingest the provided player data (Stats vs. Baselines).
Step 2: ORIENT - Identify the specific anomaly (categorized strictly as "Physical", "Tactical", or "Technical") and calculate a confidence score.
Step 3: DECIDE - Formulate a custom, dynamic intervention schedule that directly targets the anomaly.
Step 4: ACT - Output the state change via the JSON schema below.

# REQUIRED JSON SCHEMA OUTPUT
{
  "scenario_tab": {
    "category": "[Must be exactly: Physical, Tactical, or Technical]",
    "anomaly_title": "[Dynamic, highly specific title of the issue, e.g., 'Mid-block Defensive Line Positioning Error']",
    "confidence_score": [Integer between 70 and 99]
  },
  "interventions": [
    {
      "title": "[Dynamic, specific drill/recovery name, e.g., 'Asymmetric Rondo for Press Resistance']",
      "duration_mins": [Integer],
      "schedule_day": "[Day of the week]",
      "schedule_time": "[Time, e.g., '10:30 AM']",
      "icon_type": "[Choose one: water, brain, cone, barbell, target]"
    }
    // Must generate between 2 to 4 unique interventions per player
  ],
  "ooda_trace": {
    "orient_summary": "[1-2 sentences explaining exactly why the baseline was missed based on the raw data.]",
    "decide_summary": "[1-2 sentences explaining the tactical or physical reasoning behind your chosen interventions.]"
  }
}

Player Data:
${JSON.stringify({
      id: player.id,
      name: player.name,
      position: player.position,
      stats: player.stats
    }, null, 2)}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "OmniPitch",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API Error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response choices from OpenRouter API. " + JSON.stringify(data));
    }

    let content = data.choices[0].message?.content;
    if (!content) {
      throw new Error("Choice message content is empty/null. Message: " + JSON.stringify(data.choices[0].message));
    }

    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.substring(firstBrace, lastBrace + 1);
    }

    const analysis = JSON.parse(content);
    // Append playerId and hasIssue so frontend can map cleanly
    analysis.playerId = player.id;
    analysis.hasIssue = true;

    console.log(`\n[AI Intervention Response for ${player?.name || 'Unknown'}]:`, JSON.stringify(analysis, null, 2));
    res.json(analysis);
  } catch (error) {
    console.error("Agent API error (Intervention):", error.message || error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
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
            "playerId": "string (must match player.id)",
            "hasIssue": true,
            "scenario_tab": {
              "category": "Technical" | "Physical" | "Tactical",
              "anomaly_title": "string (highly specific, e.g. 'Clinical Execution Drop')",
              "confidence_score": number (integer between 70 and 99)
            },
            "interventions": [
              {
                "title": "string (specific drill name)",
                "duration_mins": number,
                "schedule_day": "string (day of week)",
                "schedule_time": "string (e.g. '10:00 AM')",
                "icon_type": "water" | "brain" | "cone" | "barbell" | "target"
              }
            ],
            "ooda_trace": {
              "orient_summary": "string (1-2 sentences reasoning)",
              "decide_summary": "string (1-2 sentences tactical choice explanation)"
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "OmniPitch",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API Error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response choices from OpenRouter API. " + JSON.stringify(data));
    }

    let content = data.choices[0].message?.content;
    if (!content) {
      throw new Error("Choice message content is empty/null. Message: " + JSON.stringify(data.choices[0].message));
    }

    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.substring(firstBrace, lastBrace + 1);
    }

    const result = JSON.parse(content);
    console.log(`\n[AI Scenarios Response]:`, JSON.stringify(result, null, 2));
    res.json(result.scenarios);
  } catch (error) {
    console.error("Agent API error (Scenarios):", error.message || error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
