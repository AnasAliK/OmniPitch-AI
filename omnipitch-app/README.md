# OmniPitch ⚽

**Autonomous Content-to-Action Framework for Elite Football Management**

OmniPitch is a React Native (Expo) application designed to automate the translation of raw football statistics into actionable training interventions. It proves that software can act as an "Agentic Assistant" to coaching staff by constantly monitoring performance baselines and intervening in the macrocycle without human prompting.

## Features

- **Multi-Team Support**: Seamlessly switch between elite teams (e.g., Manchester City, Arsenal, Liverpool).
- **Live Data Ingestion**: Uses a Playwright scraper to extract real-world squad rosters directly from FotMob's NextJS data structures.
- **Autonomous Analysis Engine**: Automatically compares player performance against positional baselines to detect anomalies (Technical, Physical, Tactical).
- **Dynamic 7-Day Scheduling**: An interactive weekly planner that can be dynamically overridden at the player level based on the analysis engine's interventions.
- **Agent Trace Visualization**: A transparent "OODA Loop" UI that visually explains *why* the Agent flagged a player and *how* it arrived at its intervention decision.

## Documentation

For a detailed breakdown of how data flows through the application and how the Agentic Engine processes anomalies, please refer to:
👉 **[Data Flow & Architecture Documentation](docs/data_flow.md)**

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- Microsoft Edge (for the scraper)
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
*Note: This script opens a headless Edge browser to scrape FotMob and generates `data/teams.json`.*

### 3. Run the Application
Start the server first to ensure real-time scraping works:
```bash
node server.js
npx expo start
```
You can run the app via the Expo Go app on your phone, or press `a` to run on Android / `i` to run on an iOS simulator.

## Technologies Used
- **React Native / Expo**: Cross-platform mobile framework.
- **Playwright**: Used for headless data scraping to bypass API protections.
- **Context API**: Handles global state for team selection and schedule interventions.
- **React Native Reanimated**: Powers the smooth UI transitions and trace visualizations.

## License
MIT
