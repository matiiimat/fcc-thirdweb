import { ObjectId } from "mongodb";
import TeamModel from "../models/Team";
import { ITactic } from "../models/Team";

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  isCompleted: boolean;
  homeTactic?: ITactic;
  awayTactic?: ITactic;
  result?: {
    homeScore: number;
    awayScore: number;
  };
}

// Helper function to get team's current tactic
export async function getTeamTactic(teamName: string): Promise<ITactic | undefined> {
  const team = await TeamModel.findOne({ teamName });
  if (!team) {
    console.log(`No team found for ${teamName}`);
    return undefined;
  }

  // Get team's tactics from their own document
  if (!team.tactics || team.tactics.length === 0) {
    console.log(`No tactics found for team ${teamName}`);
    return undefined;
  }

  // Return the most recently saved tactic
  return team.tactics[team.tactics.length - 1];
}

// Helper function to generate match schedule
export async function generateMatchSchedule(teams: string[]): Promise<Match[]> {
  const matches: Match[] = [];
  // Filter out any empty team names and MatchSchedule
  const validTeams = teams.filter(team => team && team !== "" && team !== "MatchSchedule");
  console.log('Valid teams for match generation:', validTeams);

  const numTeams = validTeams.length;
  if (numTeams < 2) {
    console.log('Not enough teams to generate matches');
    return [];
  }

  // Calculate the next 16 Mondays at 7 PM CET
  const getNextMondays = () => {
    const mondays = [];
    let currentDate = new Date();
    
    // Find the next Monday
    while (currentDate.getDay() !== 1) { // Use local day instead of UTC
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Set time to 7 PM local time
    currentDate.setHours(19, 0, 0, 0);
    
    for (let i = 0; i < 16; i++) {
      mondays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return mondays;
  };

  const matchDates = getNextMondays();
  console.log('Generated match dates:', matchDates.map(d => d.toISOString()));
  let matchIndex = 0;

  // Generate a round-robin schedule
  for (let round = 0; round < numTeams - 1; round++) {
    console.log(`Generating round ${round + 1}`);
    for (let match = 0; match < numTeams / 2; match++) {
      if (matchIndex >= 16) break; // Limit to 16 weeks

      // Calculate indices for this match
      const home = match;
      const away = numTeams - 1 - match;

      // Get team names for this match
      const homeTeam = validTeams[home];
      const awayTeam = validTeams[away];

      console.log(`Scheduling match: ${homeTeam} vs ${awayTeam}`);

      // Get tactics for both teams
      const [homeTactic, awayTactic] = await Promise.all([
        getTeamTactic(homeTeam),
        getTeamTactic(awayTeam)
      ]);

      // Create the match
      matches.push({
        id: new ObjectId().toString(),
        homeTeam,
        awayTeam,
        date: matchDates[matchIndex].toISOString(),
        isCompleted: false,
        homeTactic,
        awayTactic
      });

      matchIndex++;
    }

    // Rotate teams for next round (keep first team fixed)
    validTeams.splice(1, 0, validTeams.pop()!);
  }

  console.log('Generated matches:', matches);
  return matches;
}