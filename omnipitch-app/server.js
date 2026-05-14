const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');

const app = express();
app.use(cors());

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
    // Map team IDs to names (hardcoded for demo purposes as in the original script)
    const teamsMap = {
      '8456': 'Manchester City',
      '9825': 'Arsenal',
      '8650': 'Liverpool'
    };
    
    const teamName = teamsMap[teamId] || 'Unknown Team';
    const teamData = await scrapeTeam(teamId, teamName);
    
    res.json(teamData);
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
