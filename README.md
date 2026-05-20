# OmniPitch ⚽

**Autonomous Content-to-Action Framework for Elite Football Management**

Welcome to **OmniPitch**, a React Native (Expo) application designed to automate the translation of raw football statistics into actionable training interventions. It serves as an "Agentic Assistant" to coaching staff, constantly monitoring performance baselines and intervening in the macrocycle without human prompting.

---

## 🎯 Overall Design & Solution

The core objective of OmniPitch is to bridge the gap between raw data collection and actionable coaching decisions. Instead of just displaying dashboards of statistics, the solution proactively acts on the data. 

The design is centered around a continuous **OODA Loop (Observe, Orient, Decide, Act)**:
1. **Observe:** Ingest live player data and performance metrics.
2. **Orient:** Compare this data against predefined positional baselines to identify anomalies (e.g., a striker underperforming in shot accuracy).
3. **Decide:** Reason about the anomaly to categorize it (Technical, Physical, Tactical) and assign a confidence score.
4. **Act:** Automatically adjust the player's training schedule, injecting targeted interventions without requiring manual coach input.

---

## 🏗 Architecture Overview

The application utilizes a modern, cross-platform tech stack focused on smooth UI interactions and robust state management:

- **Framework:** [React Native](https://reactnative.dev/) built with [Expo](https://expo.dev/) for cross-platform mobile deployment.
- **State Management:** React Context API (`context/AppContext.tsx`). It manages the global state for team selection and dynamically tracks applied training interventions (`overrides`).
- **Data Ingestion:** Node.js with [Playwright](https://playwright.dev/) for headless scraping of real-world football data.
- **UI/UX & Animations:** `react-native-reanimated` powers smooth transitions, trace visualizations, and dynamic UI elements like the player roster grid.
- **Routing:** Expo Router for seamless navigation between the Dashboard, Schedule, Scenarios, and Agent Trace tabs.

### 🗂 Key Directories
- `app/(tabs)/` - Contains the main UI screens (Dashboard, Schedule, Scenarios, Agent Trace).
- `data/` - Houses the logic for the Analysis Engine, baseline definitions, and intervention generation.
- `scripts/` - Contains the Playwright scraper script used for live data extraction.
- `context/` - Global state providers.

---

## 🔌 Mock & Real APIs Used

### Real Data Ingestion (Playwright Scraper)
Instead of relying on standard HTTP REST APIs which are often rate-limited or protected, OmniPitch uses a headless Playwright scraper (`scripts/scraper.js`) to visit FotMob team pages. It extracts the raw JSON payload embedded inside the `<script id="__NEXT_DATA__">` tag, providing real-time, accurate roster data (names, ages, positions, nationalities).

### Synthetic / Mock Data Enrichment
Because the raw HTML payloads do not include granular, match-by-match statistics (like xG, passing accuracy, or sprint distance), the scraper enriches the real players with realistic, position-specific **synthetic stats**. This ensures the Analysis Engine has the necessary data points to trigger interventions while remaining grounded in real-world team rosters.

---

## 🤖 Agents Developed & Autonomous Logic

OmniPitch implements a specialized **Agentic Analysis Engine** natively within the application's data layer.

### The Agentic Analysis Engine (`data/team.ts`)
For every player, the engine autonomously performs the following reasoning steps:
1. **Baseline Comparison:** Maps the player's position (e.g., `ST`, `CB`) to hardcoded threshold expectations (e.g., Strikers need >40% shot accuracy).
2. **Anomaly Detection:** Flags any metrics falling outside expected ranges, generating an `Anomaly` object with a severity score.
3. **Categorization & Confidence:** Groups anomalies into **Technical**, **Physical**, or **Tactical** scenarios and calculates a confidence score based on severity.

### The Intervention Generator (`data/schedule.ts`)
Acting on the reasoning of the Analysis Engine, this agent creates actionable outcomes. If a player is flagged for a "Physical" issue, the intervention generator dynamically overrides the default team schedule, diverting that specific player to a "Custom Recovery" session.

---

## 🔗 Integration Implemented

- **FotMob Data Integration:** Seamless transformation of scraped `__NEXT_DATA__` state into the internal `data/teams.json` format used by the app.
- **Context API to UI Integration:** The Context API dynamically links the Agentic Analysis Engine to the UI. When an intervention is generated, it immediately reflects across:
  - The **Dashboard** (showing warning badges on players).
  - The **Schedule** (showing inline diverted sessions for flagged players).
  - The **Agent Trace** (providing transparent visual explanations of *why* the AI made a decision).

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- Microsoft Edge or Chrome (for the scraper)
- Expo CLI

### 1. Install Dependencies
```bash
npm install
```

### 2. Fetch Live Data
To populate the application with the latest real-world squad data, run the scraper script:
```bash
node scripts/scraper.js
```
*This generates the `data/teams.json` file used by the app.*

### 3. Run the Application
```bash
npx expo start
```
Run the app via the **Expo Go** app on your phone, or press `a` for Android / `i` for iOS simulator.

---

## 📄 Documentation & Traceability

For a deep dive into the underlying data flow and how anomalies are processed step-by-step, please see our detailed [Data Flow Documentation](omnipitch-app/docs/data_flow.md).
