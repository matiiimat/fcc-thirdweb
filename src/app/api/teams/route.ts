import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import TeamModel, { ITeam, IMatch } from "../../models/Team";
import PlayerModel from "../../models/Player";
import { generateMatchSchedule } from "../../lib/match";

interface TeamDocument {
  _id: string;
  teamName: string;
  captainAddress: string;
  players: string[];
  tactics: any[];
  matches?: IMatch[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

async function generateNewSchedule(teams: TeamDocument[]) {
  if (teams.length < 2) return null;

  const teamNames = teams.map(team => team.teamName);
  console.log('Teams for match generation:', teamNames);
  const newMatches = await generateMatchSchedule(teamNames);
  console.log('Generated matches:', newMatches);

  if (newMatches.length === 0) return null;

  const schedule = await TeamModel.findOne({ teamName: "MatchSchedule" });
  
  if (schedule) {
    // Update existing schedule
    const updatedSchedule = await TeamModel.findOneAndUpdate(
      { teamName: "MatchSchedule" },
      { 
        $set: { matches: newMatches }
      },
      { new: true }
    ).lean() as (TeamDocument & { matches: IMatch[] }) | null;
    
    return updatedSchedule?.matches || [];
  } else {
    // Create new schedule
    const newSchedule = await TeamModel.create({
      teamName: "MatchSchedule",
      captainAddress: "system",
      players: [],
      matches: newMatches
    });
    return newMatches;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { teamName, captainAddress } = await req.json();

    if (!teamName || !captainAddress) {
      return NextResponse.json(
        { error: "Team name and captain address are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if team name already exists
    const existingTeam = await TeamModel.findOne({ teamName });
    if (existingTeam) {
      return NextResponse.json(
        { error: "Team name already exists" },
        { status: 400 }
      );
    }

    // Create new team
    const team = new TeamModel({
      teamName,
      captainAddress,
      players: [captainAddress], // Captain is automatically a player
    });

    await team.save();

    // Update captain's player record
    await PlayerModel.findOneAndUpdate(
      { ethAddress: captainAddress },
      { team: teamName }
    );

    // Get all teams to check if we need to generate a schedule
    const allTeams = await TeamModel.find({
      teamName: { $ne: "MatchSchedule" }
    }).lean() as TeamDocument[];

    // Check if we need to generate a new schedule
    const schedule = await TeamModel.findOne({ 
      teamName: "MatchSchedule" 
    }).lean() as (TeamDocument & { matches: IMatch[] }) | null;

    let needNewSchedule = false;
    if (!schedule || !schedule.matches || schedule.matches.length === 0) {
      needNewSchedule = true;
    } else {
      // Check if all matches are in the past
      const now = new Date();
      const futureMatches = schedule.matches.filter(match => new Date(match.date) > now);
      if (futureMatches.length === 0) {
        needNewSchedule = true;
      }
    }

    if (needNewSchedule) {
      await generateNewSchedule(allTeams);
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get all teams and the match schedule
    const teams = await TeamModel.find({
      teamName: { $ne: "MatchSchedule" }
    }).sort({ createdAt: -1 }).lean() as TeamDocument[];

    if (!teams || teams.length === 0) {
      return NextResponse.json([]);
    }

    const schedule = await TeamModel.findOne({ 
      teamName: "MatchSchedule" 
    }).lean() as (TeamDocument & { matches: IMatch[] }) | null;
    
    // Check if we need to generate a new schedule
    let matches: IMatch[] = [];
    let needNewSchedule = false;

    if (!schedule || !schedule.matches || schedule.matches.length === 0) {
      needNewSchedule = true;
    } else {
      matches = schedule.matches;
      // Check if all matches are in the past
      const now = new Date();
      const futureMatches = matches.filter(match => new Date(match.date) > now);
      if (futureMatches.length === 0) {
        needNewSchedule = true;
      }
    }

    if (needNewSchedule) {
      const newMatches = await generateNewSchedule(teams);
      if (newMatches) {
        matches = newMatches;
      }
    }

    // Return teams with their matches
    const teamsWithMatches = teams.map(team => {
      // Filter matches for this team
      const teamMatches = matches.filter((match: IMatch) =>
        match.homeTeam === team.teamName || match.awayTeam === team.teamName
      );
      
      console.log(`Matches for team ${team.teamName}:`, teamMatches);
      
      return {
        ...team,
        matches: teamMatches
      };
    });

    console.log('All teams with matches:', teamsWithMatches);
    return NextResponse.json(teamsWithMatches);
  } catch (error) {
    console.error("Error fetching teams:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch teams", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}