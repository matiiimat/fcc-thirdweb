import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import TeamModel from "../../../models/Team";
import { generateMatchSchedule } from "../../../lib/match";
import { Match } from "../../../lib/match";

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

    // Get the match
    const match = schedule.matches[matchIndex];

    // Update the appropriate team's tactic
    if (match.homeTeam === teamName) {
      match.homeTactic = tactic;
    } else if (match.awayTeam === teamName) {
      match.awayTactic = tactic;
    } else {
      return NextResponse.json(
        { error: "Team is not part of this match" },
        { status: 400 }
      );
    }

    // Update the match in the schedule
    schedule.matches[matchIndex] = match;
    await schedule.save();

    // Return the updated match without simulating
    return NextResponse.json(match);
  } catch (error) {
    console.error("Error in POST /api/teams/matches:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}