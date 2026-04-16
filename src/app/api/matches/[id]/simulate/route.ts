import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import MatchModel from "../../../../models/Match";
import TeamModel from "../../../../models/Team";
import { simulateTeamMatch } from "../../../../lib/teamMatchEngine";
import { MatchEvent } from "../../../../types/match";
import { Types } from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const match = await MatchModel.findById(params.id);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Check if match should start now
    const matchDate = new Date(match.scheduledDate);
    const now = new Date();
    if (matchDate > now) {
      return NextResponse.json(
        { error: "Match cannot start before scheduled date" },
        { status: 400 }
      );
    }

    // Get current team data with their latest tactics
    const [homeTeam, awayTeam] = await Promise.all([
      TeamModel.findById(match.homeTeamId),
      TeamModel.findById(match.awayTeamId)
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: "Teams not found" },
        { status: 404 }
      );
    }

    // Get current tactics or default to first tactic
    const homeTactic = match.homeTactic || homeTeam.tactics[0];
    const awayTactic = match.awayTactic || awayTeam.tactics[0];

    // Simulate entire match at once
    const matchResult = await simulateTeamMatch(
      {
        team: homeTeam,
        tactic: homeTactic,
        players: homeTeam.players
      },
      {
        team: awayTeam,
        tactic: awayTactic,
        players: awayTeam.players
      }
    );

    // Calculate final score from events
    const homeGoals = matchResult.matchEvents.filter(
      (e: MatchEvent) => e.type === "goal" && e.teamName === homeTeam.teamName
    ).length;
    
    const awayGoals = matchResult.matchEvents.filter(
      (e: MatchEvent) => e.type === "goal" && e.teamName === awayTeam.teamName
    ).length;

    // Update match with complete simulation results
    const updatedMatch = await MatchModel.findByIdAndUpdate(
      match._id,
      {
        matchEvents: matchResult.matchEvents,
        homeStats: matchResult.homeStats,
        awayStats: matchResult.awayStats,
        homePlayerRatings: matchResult.homePlayerRatings,
        awayPlayerRatings: matchResult.awayPlayerRatings,
        homeTactic,
        awayTactic,
        isCompleted: true,
        result: {
          homeScore: homeGoals,
          awayScore: awayGoals
        }
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      match: updatedMatch
    });
  } catch (error) {
    console.error("Error simulating match:", error);
    return NextResponse.json(
      { error: "Failed to simulate match" },
      { status: 500 }
    );
  }
} 