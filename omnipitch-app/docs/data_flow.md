# OmniPitch: Data Flow & Architecture

OmniPitch is an Autonomous Content-to-Action system designed for elite football management. This document outlines how data moves from external sources, through the analysis engine, and finally into actionable schedule interventions.

## High-Level Architecture

The system operates in a continuous loop, mimicking the **OODA Loop (Observe, Orient, Decide, Act)**:
1. **Ingest (Observe)**: Scrape real-time roster data from FotMob.
2. **Analyze (Orient)**: Compare player metrics against predefined positional baselines to detect anomalies.
3. **Reason (Decide)**: Classify anomalies into scenarios (Technical, Physical, Tactical) with confidence scores.
4. **Intervene (Act)**: Generate targeted training sessions and override the default weekly schedule.

---

## 1. Data Ingestion Pipeline

**Location:** `scripts/scraper.js`

1. **Scraping Strategy:** To bypass API rate-limiting and Cloudflare blocks, the Playwright scraper visits the HTML pages of team squads on FotMob (e.g., Manchester City, Arsenal).
2. **State Extraction:** It extracts the raw JSON payload embedded inside the `<script id="__NEXT_DATA__">` tag, which contains the complete and accurate roster, including names, ages, positions, and nationalities.
3. **Data Synthesis:** Because raw HTML payloads do not include granular stats (xG, passing accuracy, duels), the scraper enriches the real players with realistic, position-specific synthetic stats. This ensures the Analysis Engine has enough data points to trigger.
4. **Output:** The transformed array is written to `data/teams.json`.

---

## 2. State & Context Management

**Location:** `context/AppContext.tsx`

The application uses React Context to manage the global state of the dashboard:
- **`selectedTeam`**: The currently active team (defaults to Manchester City). Changes trigger a re-render of the entire dashboard.
- **`overrides`**: A dictionary tracking applied training interventions, keyed by `playerId`. 
- **`switchTeam(teamId)`**: When invoked, updates the active team and immediately clears all active overrides, ensuring no data leaks between different squads.

---

## 3. The Agentic Analysis Engine

**Location:** `data/team.ts` (`analyzePlayer`)

This is the core reasoning component of the system. For every player rendered on the screen, the engine performs the following checks:

### A. Baseline Comparison
It maps the player's position (e.g., `ST`, `CB`, `GK`) to a set of hardcoded threshold expectations.
*Example: A Striker (ST) is expected to have >15 total shots and >40% shot accuracy.*

### B. Anomaly Detection
The engine checks the player's actual stats against the baseline. If a stat falls outside the expected range, it generates an `Anomaly` object containing:
- Metric name
- Expected baseline vs. Actual
- Deviation type (above/below)
- Severity score

### C. Categorization & Confidence
Anomalies are grouped into three categories:
1. **Technical**: Passing accuracy, shots, conversion.
2. **Physical**: Ground duels, sprint distance, heatmap coverage.
3. **Tactical**: Goalkeeper saves, positioning, situational awareness.

A primary category is chosen based on the severity of the anomalies, and a confidence score (0-100%) is calculated.

---

## 4. Intervention Generation

**Location:** `data/schedule.ts` (`generateInterventionSessions`)

If a player is flagged by the Analysis Engine, an intervention is generated.
1. The engine provides a primary action (e.g., "1-on-1 Finishing Drills") and a status change (e.g., "Technical Focus").
2. The intervention generator maps this category to a specific replacement session in the weekly schedule. 
3. *Example: A Physical issue might override Tuesday's "Positional Play" session with a "Custom Recovery" session for that specific player.*

---

## 5. UI & Presentation Layer

**Location:** `app/(tabs)/`

The React Native UI visually represents the data flow:
- **Dashboard (`index.tsx`)**: Shows the team roster. Players with active anomalies are badged. Interventions can be applied and viewed here.
- **Schedule (`schedule.tsx`)**: Displays the 7-day default team schedule. If a player has an override, it renders a highlighted inline warning showing exactly what session they are diverted to.
- **Scenarios (`scenarios.tsx`)**: Aggregates the individual player anomalies to identify team-wide issues (e.g., "4 players flagged for Technical Issues").
- **Agent Trace (`trace.tsx`)**: Provides transparency into the AI's reasoning, visually mapping the raw stats -> anomaly detection -> scenario categorization -> intervention generation.
