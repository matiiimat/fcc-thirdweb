import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { ValidationError } from '@/app/lib/validation';
import { calculateTrainingResult, canTrainToday } from '@/app/lib/game';

// POST /api/game/train - Train a player's stats
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get player
    const player = await Player.findOne({ playerId });
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if player can train today
    if (!canTrainToday(player.lastTrainingDate)) {
      return NextResponse.json(
        { error: 'You can only train once per day' },
        { status: 400 }
      );
    }

    try {
      // Calculate training result
      const trainingResult = calculateTrainingResult(player.stats);

      // Update player stats and last training date
      const updateData = {
        [`stats.${trainingResult.trainedStat}`]: trainingResult.newValue,
        lastTrainingDate: new Date(),
      };

      // Update player
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-__v');

      return NextResponse.json({
        success: true,
        training: {
          stat: trainingResult.trainedStat,
          previousValue: player.stats[trainingResult.trainedStat],
          newValue: trainingResult.newValue,
          improvement: trainingResult.bonus,
        },
        player: updatedPlayer,
        message: `Successfully trained ${trainingResult.trainedStat} (+${trainingResult.bonus})`,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json(
      { error: 'Failed to process training' },
      { status: 500 }
    );
  }
}