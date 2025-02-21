import { IPlayerStats, Position } from "../models/Player";
import { ITeam, ITactic, IPlayerPosition } from "../models/Team";

interface PlayerWithStats {
  ethAddress: string;
  position: Position;
  stats: IPlayerStats;
}

interface TeamMatchData {
  team: ITeam;
  tactic: ITactic;
  players: PlayerWithStats[];
}

interface MatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  fouls: number;
}

interface PlayerRating {
  ethAddress: string;
  position: Position;
  rating: number;
  stats: {
    goals: number;
    assists: number;
    shots: number;
    passes: number;
    tackles: number;
    saves?: number; // For goalkeepers
  };
}

interface MatchResult {
  homeScore: number;
  awayScore: number;
  homeStats: MatchStats;
  awayStats: MatchStats;
  homePlayerRatings: PlayerRating[];
  awayPlayerRatings: PlayerRating[];
  matchEvents: string[];
}

// Formation modifiers for attack and defense
const FORMATION_MODIFIERS: Record<string, { attack: number; defense: number }> = {
  "5-4-1": { attack: 0.8, defense: 1.2 },
  "5-3-2": { attack: 0.9, defense: 1.1 },
  "4-4-2": { attack: 1.0, defense: 1.0 },
  "4-5-1": { attack: 0.9, defense: 1.1 },
  "4-3-3": { attack: 1.2, defense: 0.8 },
  "3-4-3": { attack: 1.3, defense: 0.7 },
  "3-5-2": { attack: 1.1, defense: 0.9 },
  "5-2-3": { attack: 1.0, defense: 1.1 },
  "4-2-4": { attack: 1.4, defense: 0.6 },
  // Default modifier for unknown formations
  "default": { attack: 1.0, defense: 1.0 }
};

// Calculate average of specific stats for a group of players
const calculateAverageStats = (
  players: PlayerWithStats[],
  stats: (keyof IPlayerStats)[]
): number => {
  if (players.length === 0) return 0;
  const sum = players.reduce((acc, player) => {
    return acc + stats.reduce((sum, stat) => sum + player.stats[stat], 0);
  }, 0);
  return sum / (players.length * stats.length);
};

// Calculate position-specific rating for a player
const calculatePositionRating = (player: PlayerWithStats): number => {
  switch (player.position) {
    case "GK":
      return (
        (player.stats.defending * 2 +
          player.stats.positioning +
          player.stats.speed) /
        4
      );
    case "D":
      return (
        (player.stats.strength +
          player.stats.defending * 2 +
          player.stats.positioning) /
        4
      );
    case "M":
      return (
        (player.stats.stamina +
          player.stats.passing * 2 +
          player.stats.positioning) /
        4
      );
    case "F":
      return (
        (player.stats.shooting * 2 +
          player.stats.speed +
          player.stats.positioning) /
        4
      );
    default:
      return 0;
  }
};

// Calculate team's overall rating for attack and defense
const calculateTeamRatings = (
  teamData: TeamMatchData
): { attack: number; defense: number } => {
  const { players, tactic } = teamData;
  
  // Group players by position
  const playersByPosition = {
    GK: players.filter((p) => p.position === "GK"),
    D: players.filter((p) => p.position === "D"),
    M: players.filter((p) => p.position === "M"),
    F: players.filter((p) => p.position === "F"),
  };

  // Calculate base ratings
  const gkRating = playersByPosition.GK.reduce(
    (sum, p) => sum + calculatePositionRating(p),
    0
  );
  const defenseRating =
    playersByPosition.D.reduce((sum, p) => sum + calculatePositionRating(p), 0) /
    (playersByPosition.D.length || 1);
  const midfieldRating =
    playersByPosition.M.reduce((sum, p) => sum + calculatePositionRating(p), 0) /
    (playersByPosition.M.length || 1);
  const attackRating =
    playersByPosition.F.reduce((sum, p) => sum + calculatePositionRating(p), 0) /
    (playersByPosition.F.length || 1);

  // Apply formation modifiers (use default if formation not found)
  const formationMod = FORMATION_MODIFIERS[tactic.formation] || FORMATION_MODIFIERS.default;
  
  // Calculate base ratings with safety checks
  const baseAttack = (attackRating + (midfieldRating || 0) * 0.5) * formationMod.attack;
  const baseDefense =
    (defenseRating + (gkRating || 0) + (midfieldRating || 0) * 0.3) * formationMod.defense;

  return { attack: baseAttack, defense: baseDefense };
};

// Check if a team meets the requirements for their chosen tactic
const checkTacticRequirements = (
  teamData: TeamMatchData,
  opposingTeamData: TeamMatchData
): { bonus: number; reason: string } => {
  const { players, tactic } = teamData;
  const BONUS_AMOUNT = 0.15; // 15% bonus/malus

  switch (tactic.tacticalStyle) {
    case "None":
      return { bonus: 0, reason: "No tactical style selected" };

    case "Tiki-Taka": {
      const avgPassing = calculateAverageStats(players, ["passing"]);
      return avgPassing > 13
        ? { bonus: BONUS_AMOUNT, reason: "Tiki-Taka bonus applied" }
        : { bonus: -BONUS_AMOUNT, reason: "Failed to meet Tiki-Taka requirements" };
    }

    case "Gegenpressing": {
      const avgStaminaWorkEthic = calculateAverageStats(players, [
        "stamina",
        "workEthic",
      ]);
      return avgStaminaWorkEthic > 13
        ? { bonus: BONUS_AMOUNT, reason: "Gegenpressing bonus applied" }
        : {
            bonus: -BONUS_AMOUNT,
            reason: "Failed to meet Gegenpressing requirements",
          };
    }

    case "Kick & Rush": {
      const avgStrength = calculateAverageStats(players, ["strength"]);
      return avgStrength > 13
        ? { bonus: BONUS_AMOUNT, reason: "Kick & Rush bonus applied" }
        : {
            bonus: -BONUS_AMOUNT,
            reason: "Failed to meet Kick & Rush requirements",
          };
    }

    case "Counter Attacking": {
      const forwards = players.filter((p) => p.position === "F");
      const opposingDefMid = opposingTeamData.players.filter(
        (p) => p.position === "D" || p.position === "M"
      );
      const forwardSpeed = calculateAverageStats(forwards, ["speed"]);
      const opposingSpeed = calculateAverageStats(opposingDefMid, ["speed"]);
      
      return forwardSpeed > opposingSpeed
        ? { bonus: BONUS_AMOUNT, reason: "Counter Attacking bonus applied" }
        : {
            bonus: -BONUS_AMOUNT,
            reason: "Failed to meet Counter Attacking requirements",
          };
    }

    case "Catennacio": {
      const avgDefWorkEthic = calculateAverageStats(players, [
        "defending",
        "workEthic",
      ]);
      return avgDefWorkEthic > 13
        ? { bonus: BONUS_AMOUNT, reason: "Catennacio bonus applied" }
        : {
            bonus: -BONUS_AMOUNT,
            reason: "Failed to meet Catennacio requirements",
          };
    }

    default:
      return { bonus: 0, reason: "Invalid tactical style" };
  }
};

// Calculate player performance during the match
const calculatePlayerPerformance = (
  player: PlayerWithStats,
  teamRating: number,
  opposingTeamRating: number,
  isWinning: boolean
): PlayerRating => {
  const baseRating = calculatePositionRating(player);
  const performanceVariation = (Math.random() * 2 - 1) * 2; // -2 to +2
  const teamStrengthFactor = teamRating / opposingTeamRating;
  const moraleFactor = isWinning ? 1.1 : 0.9;

  const rating = Math.min(
    10,
    Math.max(
      1,
      (baseRating / 2) * teamStrengthFactor * moraleFactor + performanceVariation
    )
  );

  return {
    ethAddress: player.ethAddress,
    position: player.position,
    rating,
    stats: {
      goals: 0,
      assists: 0,
      shots: 0,
      passes: Math.round((player.stats.passing / 20) * 50 * (Math.random() + 0.5)),
      tackles: Math.round((player.stats.defending / 20) * 10 * (Math.random() + 0.5)),
      saves: player.position === "GK" ? Math.round(Math.random() * 5) : undefined,
    },
  };
};

// Calculate match statistics based on team ratings and tactics
const calculateMatchStats = (
  teamRating: number,
  opposingTeamRating: number,
  tacticalBonus: number
): MatchStats => {
  const totalRating = teamRating + opposingTeamRating;
  const possession = (teamRating / totalRating) * 100;
  const baseShots = Math.round((teamRating / 10) * (1 + tacticalBonus));
  const shotAccuracy = (teamRating / 20) * (1 + tacticalBonus);
  const shotsOnTarget = Math.round(baseShots * shotAccuracy);
  const passAccuracy = 50 + (teamRating / 20) * 40; // 50-90%

  return {
    possession,
    shots: baseShots,
    shotsOnTarget,
    passes: Math.round(possession * 3), // More possession = more passes
    passAccuracy,
    tackles: Math.round((opposingTeamRating / teamRating) * 20),
    fouls: Math.round(Math.random() * 5),
  };
};

// Main function to simulate a match
export const simulateMatch = async (
  homeTeamData: TeamMatchData,
  awayTeamData: TeamMatchData
): Promise<MatchResult> => {
  // Check if teams have enough players (minimum 7)
  if (homeTeamData.players.length < 7 || awayTeamData.players.length < 7) {
    if (homeTeamData.players.length >= 7) {
      return {
        homeScore: 3,
        awayScore: 0,
        homeStats: {
          possession: 100,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          passAccuracy: 0,
          tackles: 0,
          fouls: 0,
        },
        awayStats: {
          possession: 0,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          passAccuracy: 0,
          tackles: 0,
          fouls: 0,
        },
        homePlayerRatings: [],
        awayPlayerRatings: [],
        matchEvents: ["Away team forfeits due to insufficient players"],
      };
    } else if (awayTeamData.players.length >= 7) {
      return {
        homeScore: 0,
        awayScore: 3,
        homeStats: {
          possession: 0,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          passAccuracy: 0,
          tackles: 0,
          fouls: 0,
        },
        awayStats: {
          possession: 100,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          passAccuracy: 0,
          tackles: 0,
          fouls: 0,
        },
        homePlayerRatings: [],
        awayPlayerRatings: [],
        matchEvents: ["Home team forfeits due to insufficient players"],
      };
    } else {
      return {
        homeScore: 0,
        awayScore: 0,
        homeStats: {
          possession: 0,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          passAccuracy: 0,
          tackles: 0,
          fouls: 0,
        },
        awayStats: {
          possession: 0,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          passAccuracy: 0,
          tackles: 0,
          fouls: 0,
        },
        homePlayerRatings: [],
        awayPlayerRatings: [],
        matchEvents: ["Both teams forfeit due to insufficient players"],
      };
    }
  }

  // Calculate base team ratings
  const homeRatings = calculateTeamRatings(homeTeamData);
  const awayRatings = calculateTeamRatings(awayTeamData);

  // Check tactic requirements and apply bonuses/maluses
  const homeTacticResult = checkTacticRequirements(homeTeamData, awayTeamData);
  const awayTacticResult = checkTacticRequirements(awayTeamData, homeTeamData);

  // Apply tactic bonuses to attack ratings
  const finalHomeAttack = homeRatings.attack * (1 + homeTacticResult.bonus);
  const finalAwayAttack = awayRatings.attack * (1 + awayTacticResult.bonus);

  // Calculate scoring chances (attack rating vs opposing defense rating)
  const homeChances = Math.max(
    0,
    Math.round(
      (finalHomeAttack / awayRatings.defense) * 5 + Math.random() * 2 - 1
    )
  );
  const awayChances = Math.max(
    0,
    Math.round(
      (finalAwayAttack / homeRatings.defense) * 5 + Math.random() * 2 - 1
    )
  );

  // Convert chances to goals (with some randomization)
  const homeScore = Math.max(
    0,
    Math.round(homeChances * (0.3 + Math.random() * 0.2))
  );
  const awayScore = Math.max(
    0,
    Math.round(awayChances * (0.3 + Math.random() * 0.2))
  );

  // Calculate match statistics
  const homeStats = calculateMatchStats(
    finalHomeAttack,
    finalAwayAttack,
    homeTacticResult.bonus
  );
  const awayStats = calculateMatchStats(
    finalAwayAttack,
    finalHomeAttack,
    awayTacticResult.bonus
  );

  // Normalize possession to 100%
  const totalPossession = homeStats.possession + awayStats.possession;
  homeStats.possession = (homeStats.possession / totalPossession) * 100;
  awayStats.possession = (awayStats.possession / totalPossession) * 100;

  // Calculate player ratings
  const homePlayerRatings = homeTeamData.players.map(player =>
    calculatePlayerPerformance(
      player,
      finalHomeAttack,
      finalAwayAttack,
      homeScore > awayScore
    )
  );

  const awayPlayerRatings = awayTeamData.players.map(player =>
    calculatePlayerPerformance(
      player,
      finalAwayAttack,
      finalHomeAttack,
      awayScore > homeScore
    )
  );

  // Distribute goals and assists among players
  const distributeGoals = (score: number, playerRatings: PlayerRating[]) => {
    const forwards = playerRatings.filter(p => p.position === "F");
    const midfielders = playerRatings.filter(p => p.position === "M");
    const attackingPlayers = [...forwards, ...midfielders];
    
    if (attackingPlayers.length === 0) {
      // If no forwards or midfielders, any player can score
      attackingPlayers.push(...playerRatings.filter(p => p.position !== "GK"));
    }
    
    if (attackingPlayers.length === 0) return; // Safety check
    
    for (let i = 0; i < score; i++) {
      // Select a random scorer from attacking players
      const scorerIndex = Math.floor(Math.random() * attackingPlayers.length);
      const scorer = attackingPlayers[scorerIndex];
      
      if (scorer) {
        scorer.stats.goals++;
        scorer.stats.shots++;
        
        // Find potential assisters (excluding the scorer and goalkeeper)
        const potentialAssisters = playerRatings.filter(p =>
          p !== scorer && p.position !== "GK"
        );
        
        // Add an assist if there are potential assisters
        if (potentialAssisters.length > 0) {
          const assisterIndex = Math.floor(Math.random() * potentialAssisters.length);
          const assister = potentialAssisters[assisterIndex];
          if (assister) {
            assister.stats.assists++;
          }
        }
      }
    }
  };

  distributeGoals(homeScore, homePlayerRatings);
  distributeGoals(awayScore, awayPlayerRatings);

  // Generate match events
  const matchEvents = [
    `Match starts with ${homeTeamData.team.teamName} vs ${awayTeamData.team.teamName}`,
    `${homeTeamData.team.teamName} using ${homeTeamData.tactic.tacticalStyle} (${homeTacticResult.reason})`,
    `${awayTeamData.team.teamName} using ${awayTeamData.tactic.tacticalStyle} (${awayTacticResult.reason})`,
    `Possession: ${homeTeamData.team.teamName} ${Math.round(homeStats.possession)}% - ${Math.round(awayStats.possession)}% ${awayTeamData.team.teamName}`,
    `Shots: ${homeTeamData.team.teamName} ${homeStats.shots} (${homeStats.shotsOnTarget} on target) - ${awayStats.shots} (${awayStats.shotsOnTarget} on target) ${awayTeamData.team.teamName}`,
    `Final score: ${homeTeamData.team.teamName} ${homeScore} - ${awayScore} ${awayTeamData.team.teamName}`,
  ];

  // Add goal events
  homePlayerRatings
    .filter(p => p.stats.goals > 0)
    .forEach(p => {
      matchEvents.push(
        `⚽ ${p.stats.goals} goal${p.stats.goals > 1 ? 's' : ''} scored by ${p.ethAddress} for ${homeTeamData.team.teamName}`
      );
    });

  awayPlayerRatings
    .filter(p => p.stats.goals > 0)
    .forEach(p => {
      matchEvents.push(
        `⚽ ${p.stats.goals} goal${p.stats.goals > 1 ? 's' : ''} scored by ${p.ethAddress} for ${awayTeamData.team.teamName}`
      );
    });

  return {
    homeScore,
    awayScore,
    homeStats,
    awayStats,
    homePlayerRatings,
    awayPlayerRatings,
    matchEvents,
  };
};