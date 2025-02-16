import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import TeamModel from "../../../models/Team";
import { ObjectId } from "mongodb";
import { ITactic } from "../../../models/Team";

interface Match {
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
async function getTeamTactic(teamName: string): Promise<ITactic | undefined> {
  const team = await TeamModel.findOne({ teamName });
  if (!team) return undefined;

  // Get team's tactics
  const tactics = await TeamModel.findOne({ 
    teamName: "MatchSchedule", 
    "tactics.teamName": teamName 
  });

  if (!tactics?.tactics || tactics.tactics.length === 0) {
    return undefined;
  }

  // Return the most recently saved tactic
  return tactics.tactics[tactics.tactics.length - 1].tactic;
}

// Helper function to generate match schedule
async function generateMatchSchedule(teams: string[]): Promise<Match[]> {
  const matches: Match[] = [];
  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const numMatchesPerRound = Math.floor(numTeams / 2);

  // Create a copy of teams array excluding the first team
  const teamsForRotation = teams.slice(1);

  // Calculate the next 16 Mondays at 7 PM CET
  const getNextMondays = () => {
    const mondays = [];
    let currentDate = new Date();
    
    // Find the next Monday
    while (currentDate.getUTCDay() !== 1) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    // Set time to 7 PM CET (18:00 UTC during winter time, 17:00 UTC during summer time)
    // For simplicity, we'll use 18:00 UTC
    currentDate.setUTCHours(18, 0, 0, 0);
    
    for (let i = 0; i < 16; i++) {
      mondays.push(new Date(currentDate));
      currentDate.setUTCDate(currentDate.getUTCDate() + 7);
    }
    
    return mondays;
  };

  const matchDates = getNextMondays();
  let matchIndex = 0;

  // Generate matches for each round
  for (let round = 0; round < numRounds; round++) {
    const firstTeam = teams[0];
    
    // Generate matches for this round
    for (let match = 0; match < numMatchesPerRound; match++) {
      if (matchIndex >= 16) break; // Limit to 16 weeks
      
      const secondTeam = teamsForRotation[match];
      
      // Get tactics for both teams
      const [homeTactic, awayTactic] = await Promise.all([
        getTeamTactic(firstTeam),
        getTeamTactic(secondTeam)
      ]);
      
      // Alternate between home and away
      if (round % 2 === 0) {
        matches.push({
          id: new ObjectId().toString(),
          homeTeam: firstTeam,
          awayTeam: secondTeam,
          date: matchDates[matchIndex].toISOString(),
          isCompleted: false,
          homeTactic,
          awayTactic
        });
      } else {
        matches.push({
          id: new ObjectId().toString(),
          homeTeam: secondTeam,
          awayTeam: firstTeam,
          date: matchDates[matchIndex].toISOString(),
          isCompleted: false,
          homeTactic: awayTactic,
          awayTactic: homeTactic
        });
      }
      matchIndex++;
    }
    
    // Rotate teams for next round (excluding the first team)
    teamsForRotation.push(teamsForRotation.shift() || "");
  }

  return matches;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const teams = await TeamModel.find({});
    
    // Get or generate match schedule
    let schedule = await TeamModel.findOne({ teamName: "MatchSchedule" });
    
    if (!schedule) {
      // Generate new schedule if none exists
      const teamNames = teams.map((team: { teamName: string }) => team.teamName);
      const newMatches = await generateMatchSchedule(teamNames);
      
      if (newMatches.length > 0) {
        // Store matches in a special document
        schedule = await TeamModel.create({
          teamName: "MatchSchedule",
          captainAddress: "system",
          players: [],
          matches: newMatches
        });
      }
    }
    
    return NextResponse.json(schedule?.matches || []);
  } catch (error) {
    console.error("Error in GET /api/teams/matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { matchId, teamName, tactic } = await req.json();

    if (!matchId || !teamName || !tactic) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const schedule = await TeamModel.findOne({ teamName: "MatchSchedule" });
    if (!schedule) {
      return NextResponse.json(
        { error: "Match schedule not found" },
        { status: 404 }
      );
    }

    const matchIndex = schedule.matches.findIndex((m: Match) => m.id === matchId);
    if (matchIndex === -1) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Update the appropriate team's tactic
    if (schedule.matches[matchIndex].homeTeam === teamName) {
      schedule.matches[matchIndex].homeTactic = tactic;
    } else if (schedule.matches[matchIndex].awayTeam === teamName) {
      schedule.matches[matchIndex].awayTactic = tactic;
    } else {
      return NextResponse.json(
        { error: "Team is not part of this match" },
        { status: 400 }
      );
    }

    await schedule.save();
    return NextResponse.json(schedule.matches[matchIndex]);
  } catch (error) {
    console.error("Error in POST /api/teams/matches:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}