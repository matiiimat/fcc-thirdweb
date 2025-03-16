import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import MatchModel from "../../../../models/Match";
import TeamModel from "../../../../models/Team";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Find the match
    const match = await MatchModel.findById(params.id);
    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Check if the match is already completed
    if (match.isCompleted) {
      return NextResponse.json(
        { error: "Match is already completed" },
        { status: 400 }
      );
    }

    // Mark the match as completed and not in progress
    match.isCompleted = true;
    match.isInProgress = false;
    await match.save();

    // Get the teams
    const [homeTeam, awayTeam] = await Promise.all([
      TeamModel.findById(match.homeTeamId),
      TeamModel.findById(match.awayTeamId),
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: "One or both teams not found" },
        { status: 404 }
      );
    }

    // Get the match result
    const homeScore = match.result?.homeScore || 0;
    const awayScore = match.result?.awayScore || 0;

    // Update home team stats
    homeTeam.stats.gamesPlayed += 1;
    homeTeam.stats.goalsFor += homeScore;
    homeTeam.stats.goalsAgainst += awayScore;
    homeTeam.stats.goalDifference = homeTeam.stats.goalsFor - homeTeam.stats.goalsAgainst;

    if (homeScore > awayScore) {
      homeTeam.stats.wins += 1;
      homeTeam.stats.points += 3;
    } else if (homeScore === awayScore) {
      homeTeam.stats.draws += 1;
      homeTeam.stats.points += 1;
    } else {
      homeTeam.stats.losses += 1;
    }

    if (awayScore === 0) {
      homeTeam.stats.cleanSheets += 1;
    }

    // Update away team stats
    awayTeam.stats.gamesPlayed += 1;
    awayTeam.stats.goalsFor += awayScore;
    awayTeam.stats.goalsAgainst += homeScore;
    awayTeam.stats.goalDifference = awayTeam.stats.goalsFor - awayTeam.stats.goalsAgainst;

    if (awayScore > homeScore) {
      awayTeam.stats.wins += 1;
      awayTeam.stats.points += 3;
    } else if (awayScore === homeScore) {
      awayTeam.stats.draws += 1;
      awayTeam.stats.points += 1;
    } else {
      awayTeam.stats.losses += 1;
    }

    if (homeScore === 0) {
      awayTeam.stats.cleanSheets += 1;
    }

    // Save the updated teams
    await Promise.all([
      homeTeam.save(),
      awayTeam.save(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Match completed successfully",
    });
  } catch (error) {
    console.error("Error completing match:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to complete match",
      },
      { status: 500 }
    );
  }
}