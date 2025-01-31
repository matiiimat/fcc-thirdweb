import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { simulateMatch, calculateTeamRating } from '@/app/lib/game';
import { ValidationError } from '@/app/lib/validation';

// POST /api/game/match - Simulate a match between two teams
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { homeTeamId, awayTeamId } = body;

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get home team players
    const homePlayers = await Player.find({ team: homeTeamId }).select('-__v');
    if (homePlayers.length === 0) {
      return NextResponse.json(
        { error: 'Home team not found or has no players' },
        { status: 404 }
      );
    }

    // Get away team players
    const awayPlayers = await Player.find({ team: awayTeamId }).select('-__v');
    if (awayPlayers.length === 0) {
      return NextResponse.json(
        { error: 'Away team not found or has no players' },
        { status: 404 }
      );
    }

    // Simulate match
    const matchResult = simulateMatch(
      homePlayers.map(p => p.stats),
      awayPlayers.map(p => p.stats)
    );

    // Calculate rewards based on performance
    const baseReward = 100; // Base reward amount
    const winnerBonus = 50; // Additional bonus for winning team
    const drawBonus = 25; // Bonus for draw

    let homeTeamReward = baseReward;
    let awayTeamReward = baseReward;

    if (matchResult.homeScore > matchResult.awayScore) {
      homeTeamReward += winnerBonus;
    } else if (matchResult.awayScore > matchResult.homeScore) {
      awayTeamReward += winnerBonus;
    } else {
      homeTeamReward += drawBonus;
      awayTeamReward += drawBonus;
    }

    // Update player rewards
    const updatePromises = [];

    // Update home team players
    for (const player of homePlayers) {
      updatePromises.push(
        Player.findOneAndUpdate(
          { _id: player._id },
          { $inc: { money: homeTeamReward } },
          { new: true }
        )
      );
    }

    // Update away team players
    for (const player of awayPlayers) {
      updatePromises.push(
        Player.findOneAndUpdate(
          { _id: player._id },
          { $inc: { money: awayTeamReward } },
          { new: true }
        )
      );
    }

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Prepare match summary
    const matchSummary = {
      result: matchResult,
      teams: {
        home: {
          id: homeTeamId,
          rating: calculateTeamRating(homePlayers.map(p => p.stats)),
          reward: homeTeamReward,
          players: homePlayers.map(p => ({
            id: p.playerId,
            name: p.playerName,
            performance: matchResult.playerPerformances.find(
              perf => perf.playerId === p.playerId
            ),
          })),
        },
        away: {
          id: awayTeamId,
          rating: calculateTeamRating(awayPlayers.map(p => p.stats)),
          reward: awayTeamReward,
          players: awayPlayers.map(p => ({
            id: p.playerId,
            name: p.playerName,
            performance: matchResult.playerPerformances.find(
              perf => perf.playerId === p.playerId
            ),
          })),
        },
      },
    };

    return NextResponse.json({
      success: true,
      match: matchSummary,
      message: `Match completed! ${homeTeamId} ${matchResult.homeScore} - ${matchResult.awayScore} ${awayTeamId}`,
    });
  } catch (error) {
    console.error('Match simulation error:', error);
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to simulate match' },
      { status: 500 }
    );
  }
}