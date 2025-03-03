import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "../../../lib/mongodb";
import MatchModel from "../../../models/Match";
import SeasonModel from "../../../models/Season";
import TeamModel from "../../../models/Team";
import { simulateMatch } from "../../../lib/matchEngine";
import { updateTeamStats } from "../../../lib/teamStats";

// Validation schema for updating match
const updateMatchSchema = z.object({
  homeTacticId: z.string(),
  awayTacticId: z.string(),
});

export async function PATCH(
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

    // Validate match hasn't been played
    if (match.isCompleted) {
      return NextResponse.json(
        { error: "Match has already been completed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateMatchSchema.parse(body);

    // Fetch teams
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

    // Find tactics
    const homeTactic = homeTeam.tactics.id(validatedData.homeTacticId);
    const awayTactic = awayTeam.tactics.id(validatedData.awayTacticId);

    if (!homeTactic || !awayTactic) {
      return NextResponse.json(
        { error: "Invalid tactic selection" },
        { status: 400 }
      );
    }

    // Simulate match
    const homeTeamData = {
      team: homeTeam,
      tactic: homeTactic,
      players: homeTeam.players,
    };

    const awayTeamData = {
      team: awayTeam,
      tactic: awayTactic,
      players: awayTeam.players,
    };

    const matchResult = await simulateMatch(homeTeamData, awayTeamData);

    // Update match record
    match.isCompleted = true;
    match.homeTactic = homeTactic;
    match.awayTactic = awayTactic;
    match.result = {
      homeScore: matchResult.homeScore,
      awayScore: matchResult.awayScore,
    };
    match.homeStats = matchResult.homeStats;
    match.awayStats = matchResult.awayStats;
    match.homePlayerRatings = matchResult.homePlayerRatings;
    match.awayPlayerRatings = matchResult.awayPlayerRatings;
    match.events = matchResult.matchEvents;

    await match.save();

    // Update team stats
    const updatedHomeStats = updateTeamStats(
      homeTeam.stats,
      true,
      matchResult,
      homeTactic
    );

    const updatedAwayStats = updateTeamStats(
      awayTeam.stats,
      false,
      matchResult,
      awayTactic
    );

    await Promise.all([
      TeamModel.findByIdAndUpdate(homeTeam._id, {
        $set: { stats: updatedHomeStats },
      }),
      TeamModel.findByIdAndUpdate(awayTeam._id, {
        $set: { stats: updatedAwayStats },
      }),
    ]);

    // If match is part of a season, update season standings
    if (match.seasonId) {
      const season = await SeasonModel.findById(match.seasonId);
      if (season) {
        // Update home team stats
        const homeTeamInSeason = season.registeredTeams.find(
          (t: { teamId: { equals: (id: any) => boolean } }) => t.teamId.equals(match.homeTeamId)
        );
        if (homeTeamInSeason) {
          homeTeamInSeason.gamesPlayed += 1;
          homeTeamInSeason.goalsFor += matchResult.homeScore;
          homeTeamInSeason.goalsAgainst += matchResult.awayScore;
          homeTeamInSeason.goalDifference = homeTeamInSeason.goalsFor - homeTeamInSeason.goalsAgainst;

          if (matchResult.homeScore > matchResult.awayScore) {
            homeTeamInSeason.wins += 1;
            homeTeamInSeason.points += 3;
          } else if (matchResult.homeScore === matchResult.awayScore) {
            homeTeamInSeason.draws += 1;
            homeTeamInSeason.points += 1;
          } else {
            homeTeamInSeason.losses += 1;
          }
        }

        // Update away team stats
        const awayTeamInSeason = season.registeredTeams.find(
          (t: { teamId: { equals: (id: any) => boolean } }) => t.teamId.equals(match.awayTeamId)
        );
        if (awayTeamInSeason) {
          awayTeamInSeason.gamesPlayed += 1;
          awayTeamInSeason.goalsFor += matchResult.awayScore;
          awayTeamInSeason.goalsAgainst += matchResult.homeScore;
          awayTeamInSeason.goalDifference = awayTeamInSeason.goalsFor - awayTeamInSeason.goalsAgainst;

          if (matchResult.awayScore > matchResult.homeScore) {
            awayTeamInSeason.wins += 1;
            awayTeamInSeason.points += 3;
          } else if (matchResult.awayScore === matchResult.homeScore) {
            awayTeamInSeason.draws += 1;
            awayTeamInSeason.points += 1;
          } else {
            awayTeamInSeason.losses += 1;
          }
        }

        await season.save();
      }
    }

    return NextResponse.json({
      success: true,
      match,
      homeStats: updatedHomeStats,
      awayStats: updatedAwayStats,
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update match",
      },
      { status: 500 }
    );
  }
}

export async function GET(
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

    return NextResponse.json({
      success: true,
      match,
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch match",
      },
      { status: 500 }
    );
  }
}