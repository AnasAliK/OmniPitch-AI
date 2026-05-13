// This is a synthetic data generator to simulate the Fotmob Scraper output
// since the network is blocking the Chromium download.

const fs = require('fs');
const path = require('path');

const TEAMS = [
  {
    id: '8456',
    name: 'Manchester City',
    shortName: 'MCI',
    manager: 'Pep Guardiola',
    players: [
      { id: 'haaland', name: 'Erling Haaland', shortName: 'Haaland', number: 9, position: 'ST', nationality: '🇳🇴', age: 25, avatarInitials: 'EH', avatarColor: '#ef4444', stats: { matchCount: 3, minutesPlayed: 270, goals: 0, xG: 2.4, xA: 0.3, assists: 0, shotsTotal: 15, shotsOnTarget: 8, groundDuelsWon: 12, groundDuelsTotal: 25, passingAccuracy: 72, heatmapCoverage: 'Normal', sprintDistance: 'Normal' }, status: 'Active' },
      { id: 'debruyne', name: 'Kevin De Bruyne', shortName: 'De Bruyne', number: 17, position: 'CAM', nationality: '🇧🇪', age: 34, avatarInitials: 'KB', avatarColor: '#10b981', stats: { matchCount: 3, minutesPlayed: 270, goals: 0, xG: 1.1, xA: 2.1, assists: 1, shotsTotal: 8, shotsOnTarget: 3, groundDuelsWon: 5, groundDuelsTotal: 14, passingAccuracy: 88, heatmapCoverage: 'Contracted', sprintDistance: 'Low' }, status: 'Active' },
      { id: 'rodri', name: 'Rodrigo', shortName: 'Rodri', number: 16, position: 'CDM', nationality: '🇪🇸', age: 29, avatarInitials: 'RO', avatarColor: '#10b981', stats: { matchCount: 3, minutesPlayed: 270, goals: 1, xG: 0.5, xA: 0.8, assists: 1, shotsTotal: 3, shotsOnTarget: 2, groundDuelsWon: 16, groundDuelsTotal: 22, passingAccuracy: 94, heatmapCoverage: 'Wide', sprintDistance: 'Normal' }, status: 'Active' },
      { id: 'ederson', name: 'Ederson', shortName: 'Ederson', number: 31, position: 'GK', nationality: '🇧🇷', age: 32, avatarInitials: 'ED', avatarColor: '#f59e0b', stats: { matchCount: 3, minutesPlayed: 270, goals: 0, xG: 0, xA: 0, assists: 0, shotsTotal: 0, shotsOnTarget: 0, groundDuelsWon: 2, groundDuelsTotal: 3, passingAccuracy: 86, savePercentage: 52, goalsConceded: 7, counterGoalsConceded: 4, heatmapCoverage: 'Normal', sprintDistance: 'Normal' }, status: 'Active' }
    ]
  },
  {
    id: '9825',
    name: 'Arsenal',
    shortName: 'ARS',
    manager: 'Mikel Arteta',
    players: [
      { id: 'saka', name: 'Bukayo Saka', shortName: 'Saka', number: 7, position: 'RW', nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 24, avatarInitials: 'BS', avatarColor: '#ef4444', stats: { matchCount: 3, minutesPlayed: 250, goals: 1, xG: 1.8, xA: 1.2, assists: 2, shotsTotal: 9, shotsOnTarget: 4, groundDuelsWon: 15, groundDuelsTotal: 25, passingAccuracy: 82, heatmapCoverage: 'Wide', sprintDistance: 'High' }, status: 'Active' },
      { id: 'odegaard', name: 'Martin Ødegaard', shortName: 'Ødegaard', number: 8, position: 'CAM', nationality: '🇳🇴', age: 26, avatarInitials: 'MO', avatarColor: '#10b981', stats: { matchCount: 3, minutesPlayed: 270, goals: 0, xG: 0.4, xA: 1.5, assists: 0, shotsTotal: 4, shotsOnTarget: 1, groundDuelsWon: 8, groundDuelsTotal: 20, passingAccuracy: 89, heatmapCoverage: 'Normal', sprintDistance: 'Normal' }, status: 'Active' },
      { id: 'saliba', name: 'William Saliba', shortName: 'Saliba', number: 2, position: 'CB', nationality: '🇫🇷', age: 24, avatarInitials: 'WS', avatarColor: '#3b82f6', stats: { matchCount: 3, minutesPlayed: 270, goals: 0, xG: 0.1, xA: 0, assists: 0, shotsTotal: 1, shotsOnTarget: 0, groundDuelsWon: 18, groundDuelsTotal: 22, passingAccuracy: 93, heatmapCoverage: 'Normal', sprintDistance: 'Normal' }, status: 'Active' },
      { id: 'raya', name: 'David Raya', shortName: 'Raya', number: 22, position: 'GK', nationality: '🇪🇸', age: 30, avatarInitials: 'DR', avatarColor: '#f59e0b', stats: { matchCount: 3, minutesPlayed: 270, goals: 0, xG: 0, xA: 0, assists: 0, shotsTotal: 0, shotsOnTarget: 0, groundDuelsWon: 1, groundDuelsTotal: 2, passingAccuracy: 78, savePercentage: 85, goalsConceded: 2, counterGoalsConceded: 0, heatmapCoverage: 'Normal', sprintDistance: 'Normal' }, status: 'Active' }
    ]
  },
  {
    id: '8650',
    name: 'Liverpool',
    shortName: 'LIV',
    manager: 'Arne Slot',
    players: [
      { id: 'salah', name: 'Mohamed Salah', shortName: 'Salah', number: 11, position: 'RW', nationality: '🇪🇬', age: 33, avatarInitials: 'MS', avatarColor: '#ef4444', stats: { matchCount: 3, minutesPlayed: 260, goals: 2, xG: 1.5, xA: 0.8, assists: 1, shotsTotal: 10, shotsOnTarget: 6, groundDuelsWon: 10, groundDuelsTotal: 22, passingAccuracy: 76, heatmapCoverage: 'Contracted', sprintDistance: 'Low' }, status: 'Active' },
      { id: 'macallister', name: 'Alexis Mac Allister', shortName: 'Mac Allister', number: 10, position: 'CM', nationality: '🇦🇷', age: 26, avatarInitials: 'AM', avatarColor: '#10b981', stats: { matchCount: 3, minutesPlayed: 270, goals: 0, xG: 0.3, xA: 1.0, assists: 1, shotsTotal: 3, shotsOnTarget: 1, groundDuelsWon: 14, groundDuelsTotal: 28, passingAccuracy: 88, heatmapCoverage: 'Wide', sprintDistance: 'High' }, status: 'Active' },
      { id: 'vandijk', name: 'Virgil van Dijk', shortName: 'van Dijk', number: 4, position: 'CB', nationality: '🇳🇱', age: 34, avatarInitials: 'VD', avatarColor: '#3b82f6', stats: { matchCount: 3, minutesPlayed: 270, goals: 1, xG: 0.5, xA: 0.1, assists: 0, shotsTotal: 3, shotsOnTarget: 1, groundDuelsWon: 20, groundDuelsTotal: 24, passingAccuracy: 91, heatmapCoverage: 'Normal', sprintDistance: 'Normal' }, status: 'Active' },
      { id: 'alisson', name: 'Alisson Becker', shortName: 'Alisson', number: 1, position: 'GK', nationality: '🇧🇷', age: 33, avatarInitials: 'AB', avatarColor: '#f59e0b', stats: { matchCount: 3, minutesPlayed: 270, goals: 0, xG: 0, xA: 0, assists: 0, shotsTotal: 0, shotsOnTarget: 0, groundDuelsWon: 2, groundDuelsTotal: 2, passingAccuracy: 84, savePercentage: 70, goalsConceded: 3, counterGoalsConceded: 1, heatmapCoverage: 'Normal', sprintDistance: 'Normal' }, status: 'Active' }
    ]
  }
];

fs.writeFileSync(path.join(__dirname, '../data/teams.json'), JSON.stringify(TEAMS, null, 2));
console.log('Generated mock teams.json for app data layer.');
