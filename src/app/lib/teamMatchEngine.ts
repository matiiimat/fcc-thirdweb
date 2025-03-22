import { IPlayerStats, Position } from "../models/Player";
import { ITeam, ITactic } from "../models/Team";
import {
  midfieldEvents,
  attackEvents,
  defenseEvents,
  shotEvents,
  systemEvents,
  getRandomDescription,
  formatDescription
} from "./matchEventDescriptions";

interface PlayerWithStats {
  ethAddress: string;
  username: string; // Player's username for event generation
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
  username: string; // Player's username for display
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

export interface MatchEvent {
  minute: number;
  type: "goal" | "action" | "system" | "skill_check";
  description: string;
  playerAddress?: string;
  teamName: string;
}

interface MatchResult {
  homeScore: number;
  awayScore: number;
  homeStats: MatchStats;
  awayStats: MatchStats;
  homePlayerRatings: PlayerRating[];
  awayPlayerRatings: PlayerRating[];
  matchEvents: MatchEvent[];
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
    username: player.username,
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

// Perform a skill check between two players
const performSkillCheck = (
  attacker: PlayerWithStats,
  defender: PlayerWithStats,
  attackerSkill: keyof IPlayerStats,
  defenderSkill: keyof IPlayerStats,
  attackerBonus: number = 0,
  defenderBonus: number = 0
): { 
  success: boolean; 
  margin: number; 
  attackerValue: number; 
  defenderValue: number;
} => {
  // Add some randomness to make it interesting
  const randomFactor = Math.random() * 4 - 2; // -2 to +2
  
  // Calculate the skill values with bonuses
  const attackerValue = attacker.stats[attackerSkill] + attackerBonus + randomFactor;
  const defenderValue = defender.stats[defenderSkill] + defenderBonus + randomFactor;
  
  // Calculate the margin of success/failure
  const margin = attackerValue - defenderValue;
  
  // Return the result
  return {
    success: margin > 0,
    margin: Math.abs(margin),
    attackerValue,
    defenderValue
  };
};

// Generate a detailed event description based on a skill check
const generateSkillCheckEvent = (
  attacker: PlayerWithStats,
  defender: PlayerWithStats,
  result: { success: boolean; margin: number },
  attackerTeam: string,
  defenderTeam: string,
  context: "midfield" | "attack" | "defense" | "shot"
): MatchEvent => {
  const minute = Math.floor(Math.random() * 90) + 1;
  let description = "";
  let type: "action" | "skill_check" | "goal" = "skill_check";
  
  // Get the appropriate event category based on context
  let eventCategory;
  switch (context) {
    case "midfield":
      eventCategory = midfieldEvents;
      break;
    case "attack":
      eventCategory = attackEvents;
      break;
    case "defense":
      eventCategory = defenseEvents;
      break;
    case "shot":
      eventCategory = shotEvents;
      if (result.success) {
        type = "goal";
      }
      break;
  }
  
  // Get a random description from the appropriate category
  const rawDescription = getRandomDescription(eventCategory, result.success, result.margin);
  
  // Format the description with player usernames
  description = formatDescription(rawDescription, {
    attacker: attacker.username,
    defender: defender.username
  });
  
  return {
    minute,
    type,
    description,
    playerAddress: attacker.ethAddress,
    teamName: attackerTeam
  };
};

// Generate a sequence of match events based on team and player attributes
const generateMatchSequence = (
  homeTeamData: TeamMatchData,
  awayTeamData: TeamMatchData,
  homeRatings: { attack: number; defense: number },
  awayRatings: { attack: number; defense: number },
  homeTacticBonus: number,
  awayTacticBonus: number
): MatchEvent[] => {
  const events: MatchEvent[] = [];
  const matchDuration = 90; // 90 minutes in a football match
  const eventInterval = 3; // Generate an event approximately every 5 minutes
  const numEvents = matchDuration / eventInterval;
  
  // Generate events at regular intervals
  for (let i = 0; i < numEvents; i++) {
    const minute = Math.min(i * eventInterval + 1, 90); // Calculate match minute (1-90)
    
    // Determine which team has possession based on team ratings
    const homeAttackRating = homeRatings.attack * (1 + homeTacticBonus);
    const awayAttackRating = awayRatings.attack * (1 + awayTacticBonus);
    const totalAttackRating = homeAttackRating + awayAttackRating;
    const homePossessionChance = homeAttackRating / totalAttackRating;
    
    const isHomePossession = Math.random() < homePossessionChance;
    
    if (isHomePossession) {
      // Home team has possession
      const attackingTeam = homeTeamData;
      const defendingTeam = awayTeamData;
      
      // Select random players for the action
      const midfielders = attackingTeam.players.filter(p => p.position === "M");
      const forwards = attackingTeam.players.filter(p => p.position === "F");
      const opposingDefenders = defendingTeam.players.filter(p => p.position === "D");
      const opposingGoalkeeper = defendingTeam.players.find(p => p.position === "GK");
      
      if (midfielders.length > 0 && opposingDefenders.length > 0) {
        // Midfield battle
        const midfielder = midfielders[Math.floor(Math.random() * midfielders.length)];
        const opposingDefender = opposingDefenders[Math.floor(Math.random() * opposingDefenders.length)];
        
        const midfieldResult = performSkillCheck(
          midfielder,
          opposingDefender,
          "passing",
          "defending",
          homeTacticBonus * 10, // Convert bonus to points
          0
        );
        
        const midfieldEvent = generateSkillCheckEvent(
          midfielder,
          opposingDefender,
          midfieldResult,
          attackingTeam.team.teamName,
          defendingTeam.team.teamName,
          "midfield"
        );
        
        midfieldEvent.minute = minute;
        events.push(midfieldEvent);
        
        // If midfielder wins, proceed to attack
        if (midfieldResult.success && forwards.length > 0) {
          const forward = forwards[Math.floor(Math.random() * forwards.length)];
          const defender = opposingDefenders[Math.floor(Math.random() * opposingDefenders.length)];
          
          const attackResult = performSkillCheck(
            forward,
            defender,
            "speed",
            "speed",
            homeTacticBonus * 10,
            0
          );
          
          const attackEvent = generateSkillCheckEvent(
            forward,
            defender,
            attackResult,
            attackingTeam.team.teamName,
            defendingTeam.team.teamName,
            "attack"
          );
          
          attackEvent.minute = minute;
          events.push(attackEvent);
          
          // If forward wins and there's a goalkeeper, proceed to shot
          if (attackResult.success && opposingGoalkeeper) {
            const shotResult = performSkillCheck(
              forward,
              opposingGoalkeeper,
              "shooting",
              "defending",
              homeTacticBonus * 10,
              0
            );
            
            const shotEvent = generateSkillCheckEvent(
              forward,
              opposingGoalkeeper,
              shotResult,
              attackingTeam.team.teamName,
              defendingTeam.team.teamName,
              "shot"
            );
            
            shotEvent.minute = minute;
            events.push(shotEvent);
          }
        }
      }
    } else {
      // Away team has possession
      const attackingTeam = awayTeamData;
      const defendingTeam = homeTeamData;
      
      // Select random players for the action
      const midfielders = attackingTeam.players.filter(p => p.position === "M");
      const forwards = attackingTeam.players.filter(p => p.position === "F");
      const opposingDefenders = defendingTeam.players.filter(p => p.position === "D");
      const opposingGoalkeeper = defendingTeam.players.find(p => p.position === "GK");
      
      if (midfielders.length > 0 && opposingDefenders.length > 0) {
        // Midfield battle
        const midfielder = midfielders[Math.floor(Math.random() * midfielders.length)];
        const opposingDefender = opposingDefenders[Math.floor(Math.random() * opposingDefenders.length)];
        
        const midfieldResult = performSkillCheck(
          midfielder,
          opposingDefender,
          "passing",
          "defending",
          awayTacticBonus * 10, // Convert bonus to points
          0
        );
        
        const midfieldEvent = generateSkillCheckEvent(
          midfielder,
          opposingDefender,
          midfieldResult,
          attackingTeam.team.teamName,
          defendingTeam.team.teamName,
          "midfield"
        );
        
        midfieldEvent.minute = minute;
        events.push(midfieldEvent);
        
        // If midfielder wins, proceed to attack
        if (midfieldResult.success && forwards.length > 0) {
          const forward = forwards[Math.floor(Math.random() * forwards.length)];
          const defender = opposingDefenders[Math.floor(Math.random() * opposingDefenders.length)];
          
          const attackResult = performSkillCheck(
            forward,
            defender,
            "speed",
            "speed",
            awayTacticBonus * 10,
            0
          );
          
          const attackEvent = generateSkillCheckEvent(
            forward,
            defender,
            attackResult,
            attackingTeam.team.teamName,
            defendingTeam.team.teamName,
            "attack"
          );
          
          attackEvent.minute = minute;
          events.push(attackEvent);
          
          // If forward wins and there's a goalkeeper, proceed to shot
          if (attackResult.success && opposingGoalkeeper) {
            const shotResult = performSkillCheck(
              forward,
              opposingGoalkeeper,
              "shooting",
              "defending",
              awayTacticBonus * 10,
              0
            );
            
            const shotEvent = generateSkillCheckEvent(
              forward,
              opposingGoalkeeper,
              shotResult,
              attackingTeam.team.teamName,
              defendingTeam.team.teamName,
              "shot"
            );
            
            shotEvent.minute = minute;
            events.push(shotEvent);
          }
        }
      }
    }
  }
  
  return events;
};

// Main function to simulate a team match
export const simulateTeamMatch = async (
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
        matchEvents: [
          {
            minute: 0,
            type: "system",
            description: formatDescription(systemEvents.forfeit, { team: awayTeamData.team.teamName }),
            teamName: awayTeamData.team.teamName
          }
        ],
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
        matchEvents: [
          {
            minute: 0,
            type: "system",
            description: formatDescription(systemEvents.forfeit, { team: homeTeamData.team.teamName }),
            teamName: homeTeamData.team.teamName
          }
        ],
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
        matchEvents: [
          {
            minute: 0,
            type: "system",
            description: systemEvents.bothForfeit,
            teamName: "System"
          }
        ],
      };
    }
  }

  // Calculate base team ratings
  const homeRatings = calculateTeamRatings(homeTeamData);
  const awayRatings = calculateTeamRatings(awayTeamData);

  // Check tactic requirements and apply bonuses/maluses
  const homeTacticResult = checkTacticRequirements(homeTeamData, awayTeamData);
  const awayTacticResult = checkTacticRequirements(awayTeamData, homeTeamData);

  // Generate match events
  const matchEvents: MatchEvent[] = [
    {
      minute: 0,
      type: "system",
      description: formatDescription(systemEvents.matchStart, {
        homeTeam: homeTeamData.team.teamName,
        awayTeam: awayTeamData.team.teamName
      }),
      teamName: "System"
    },
    {
      minute: 0,
      type: "system",
      description: formatDescription(systemEvents.tacticInfo, {
        team: homeTeamData.team.teamName,
        tactic: homeTeamData.tactic.tacticalStyle,
        reason: homeTacticResult.reason
      }),
      teamName: homeTeamData.team.teamName
    },
    {
      minute: 0,
      type: "system",
      description: formatDescription(systemEvents.tacticInfo, {
        team: awayTeamData.team.teamName,
        tactic: awayTeamData.tactic.tacticalStyle,
        reason: awayTacticResult.reason
      }),
      teamName: awayTeamData.team.teamName
    }
  ];

  // Generate detailed match sequence
  const sequenceEvents = generateMatchSequence(
    homeTeamData,
    awayTeamData,
    homeRatings,
    awayRatings,
    homeTacticResult.bonus,
    awayTacticResult.bonus
  );
  
  matchEvents.push(...sequenceEvents);
  
  // Add final whistle event
  matchEvents.push({
    minute: 90,
    type: "system",
    description: systemEvents.finalWhistle,
    teamName: "System"
  });

  // Count goals
  const homeGoals = matchEvents.filter(
    e => e.type === "goal" && e.teamName === homeTeamData.team.teamName
  ).length;
  
  const awayGoals = matchEvents.filter(
    e => e.type === "goal" && e.teamName === awayTeamData.team.teamName
  ).length;

  // Apply tactic bonuses to attack ratings
  const finalHomeAttack = homeRatings.attack * (1 + homeTacticResult.bonus);
  const finalAwayAttack = awayRatings.attack * (1 + awayTacticResult.bonus);

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
      homeGoals > awayGoals
    )
  );

  const awayPlayerRatings = awayTeamData.players.map(player =>
    calculatePlayerPerformance(
      player,
      finalAwayAttack,
      finalHomeAttack,
      awayGoals > homeGoals
    )
  );

  // Distribute goals and assists among players based on the events
  const goalEvents = matchEvents.filter(e => e.type === "goal");
  
  goalEvents.forEach(event => {
    if (event.playerAddress) {
      const isHomeTeam = event.teamName === homeTeamData.team.teamName;
      const playerRatings = isHomeTeam ? homePlayerRatings : awayPlayerRatings;
      
      // Find the player who scored
      const scorer = playerRatings.find(p => p.ethAddress === event.playerAddress);
      if (scorer) {
        scorer.stats.goals++;
        scorer.stats.shots++;
        
        // Find a random teammate to assist (excluding the scorer and goalkeeper)
        const potentialAssisters = playerRatings.filter(p =>
          p.ethAddress !== event.playerAddress && p.position !== "GK"
        );
        
        if (potentialAssisters.length > 0) {
          const assisterIndex = Math.floor(Math.random() * potentialAssisters.length);
          const assister = potentialAssisters[assisterIndex];
          if (assister) {
            assister.stats.assists++;
          }
        }
      }
    }
  });

  // Add summary events
  matchEvents.push({
    minute: 90,
    type: "system",
    description: formatDescription(systemEvents.possession, {
      homeTeam: homeTeamData.team.teamName,
      homePossession: Math.round(homeStats.possession).toString(),
      awayPossession: Math.round(awayStats.possession).toString(),
      awayTeam: awayTeamData.team.teamName
    }),
    teamName: "System"
  });
  
  matchEvents.push({
    minute: 90,
    type: "system",
    description: formatDescription(systemEvents.shots, {
      homeTeam: homeTeamData.team.teamName,
      homeShots: homeStats.shots.toString(),
      homeShotsOnTarget: homeStats.shotsOnTarget.toString(),
      awayShots: awayStats.shots.toString(),
      awayShotsOnTarget: awayStats.shotsOnTarget.toString(),
      awayTeam: awayTeamData.team.teamName
    }),
    teamName: "System"
  });
  
  matchEvents.push({
    minute: 90,
    type: "system",
    description: formatDescription(systemEvents.finalScore, {
      homeTeam: homeTeamData.team.teamName,
      homeScore: homeGoals.toString(),
      awayScore: awayGoals.toString(),
      awayTeam: awayTeamData.team.teamName
    }),
    teamName: "System"
  });

  return {
    homeScore: homeGoals,
    awayScore: awayGoals,
    homeStats,
    awayStats,
    homePlayerRatings,
    awayPlayerRatings,
    matchEvents,
  };
};