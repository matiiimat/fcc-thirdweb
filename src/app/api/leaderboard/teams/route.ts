import { NextRequest, NextResponse } from "next/server";
import TeamModel from "@/app/models/Team";
import connectDB from "../../../lib/mongodb";
import { calculateWinRate } from "@/app/lib/teamStats";

export type LeaderboardSortBy = 
  | "points" 
  | "wins" 
  | "goalDifference" 
  | "goalsFor" 
  | "cleanSheets" 
  | "winRate";

interface LeaderboardEntry {
  teamName: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
  points: number;
  winRate: number;
  form: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sortBy = (searchParams.get("sortBy") || "points") as LeaderboardSortBy;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Fetch all teams with their stats
    const teams = await TeamModel.find({}, {
      teamName: 1,
      stats: 1,
    });

    // Calculate additional stats and sort teams
    const leaderboard: LeaderboardEntry[] = teams
      .map(team => {
        const stats = team.stats;
        const points = stats.wins * 3 + stats.draws;
        const goalDifference = stats.goalsFor - stats.goalsAgainst;
        const winRate = calculateWinRate(stats);

        return {
          teamName: team.teamName,
          gamesPlayed: stats.gamesPlayed,
          wins: stats.wins,
          draws: stats.draws,
          losses: stats.losses,
          goalsFor: stats.goalsFor,
          goalsAgainst: stats.goalsAgainst,
          goalDifference,
          cleanSheets: stats.cleanSheets,
          points,
          winRate,
          form: stats.gamesPlayed === 0 ? "N/A" : 
            ((points / (stats.gamesPlayed * 3)) * 100 >= 60 ? "Good" : 
            ((points / (stats.gamesPlayed * 3)) * 100 >= 40 ? "Average" : "Poor")),
        };
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "points":
            return b.points - a.points || // Primary sort by points
                   b.goalDifference - a.goalDifference || // Secondary sort by goal difference
                   b.goalsFor - a.goalsFor; // Tertiary sort by goals scored
          case "wins":
            return b.wins - a.wins;
          case "goalDifference":
            return b.goalDifference - a.goalDifference;
          case "goalsFor":
            return b.goalsFor - a.goalsFor;
          case "cleanSheets":
            return b.cleanSheets - a.cleanSheets;
          case "winRate":
            return b.winRate - a.winRate;
          default:
            return b.points - a.points;
        }
      })
      .slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch leaderboard",
      },
      { status: 500 }
    );
  }
}