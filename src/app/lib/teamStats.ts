import { ITactic } from "../models/Team";

interface MatchResult {
  homeScore: number;
  awayScore: number;
}

interface TeamStats {
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  tacticsUsed: {
    name: string;
    gamesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }[];
}

export function updateTeamStats(
  currentStats: TeamStats | undefined,
  isHomeTeam: boolean,
  result: MatchResult,
  tactic?: ITactic
): TeamStats {
  // Initialize default stats if none exist
  const stats = {
    gamesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    cleanSheets: 0,
    tacticsUsed: [],
    ...currentStats
  };
  const teamScore = isHomeTeam ? result.homeScore : result.awayScore;
  const opponentScore = isHomeTeam ? result.awayScore : result.homeScore;

  // Update general stats
  stats.gamesPlayed++;
  stats.goalsFor += teamScore;
  stats.goalsAgainst += opponentScore;

  if (teamScore > opponentScore) {
    stats.wins++;
  } else if (teamScore < opponentScore) {
    stats.losses++;
  } else {
    stats.draws++;
  }

  if (opponentScore === 0) {
    stats.cleanSheets++;
  }

  // Update tactic-specific stats if a tactic was used
  if (tactic) {
    let tacticStats = stats.tacticsUsed.find(t => t.name === tactic.name);
    
    if (!tacticStats) {
      // Initialize stats for new tactic
      tacticStats = {
        name: tactic.name,
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      };
      stats.tacticsUsed.push(tacticStats);
    }

    // Update tactic stats
    tacticStats.gamesPlayed++;
    tacticStats.goalsFor += teamScore;
    tacticStats.goalsAgainst += opponentScore;

    if (teamScore > opponentScore) {
      tacticStats.wins++;
    } else if (teamScore < opponentScore) {
      tacticStats.losses++;
    } else {
      tacticStats.draws++;
    }
  }

  return stats;
}

export function calculateWinRate(stats: TeamStats): number {
  if (stats.gamesPlayed === 0) return 0;
  return (stats.wins / stats.gamesPlayed) * 100;
}

export function calculateGoalDifference(stats: TeamStats): number {
  return stats.goalsFor - stats.goalsAgainst;
}

export function calculateAverageGoalsScored(stats: TeamStats): number {
  if (stats.gamesPlayed === 0) return 0;
  return stats.goalsFor / stats.gamesPlayed;
}

export function calculateAverageGoalsConceded(stats: TeamStats): number {
  if (stats.gamesPlayed === 0) return 0;
  return stats.goalsAgainst / stats.gamesPlayed;
}

export function calculateCleanSheetPercentage(stats: TeamStats): number {
  if (stats.gamesPlayed === 0) return 0;
  return (stats.cleanSheets / stats.gamesPlayed) * 100;
}

export function getTacticEffectiveness(stats: TeamStats): { name: string; effectiveness: number }[] {
  return stats.tacticsUsed.map(tactic => ({
    name: tactic.name,
    effectiveness: tactic.gamesPlayed === 0 ? 0 : 
      ((tactic.wins * 3 + tactic.draws) / (tactic.gamesPlayed * 3)) * 100
  })).sort((a, b) => b.effectiveness - a.effectiveness);
}

export function getTeamForm(stats: TeamStats): string {
  const points = stats.gamesPlayed === 0 ? 0 : 
    ((stats.wins * 3 + stats.draws) / (stats.gamesPlayed * 3)) * 100;
  
  if (points >= 80) return "Excellent";
  if (points >= 60) return "Good";
  if (points >= 40) return "Average";
  if (points >= 20) return "Poor";
  return "Bad";
}