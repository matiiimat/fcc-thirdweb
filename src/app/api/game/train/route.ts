import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { calculateTrainingResult } from '@/app/lib/game';
import { ValidationError } from '@/app/lib/validation';

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
    const today = new Date().toDateString();
    const lastTraining = player.lastTrainingDate 
      ? new Date(player.lastTrainingDate).toDateString()
      : null;

    if (lastTraining === today) {
      return NextResponse.json(
        { error: 'You can only train once per day' },
        { status: 400 }
      );
    }

    try {
      // Calculate training result
      const trainingResult = calculateTrainingResult(player.stats);
      console.log('Training result:', trainingResult); // Debug log

      // Apply work ethic bonus based on consecutive connections
      const workEthicBonus = Math.min(player.consecutiveConnections / 10, 1); // Max 100% bonus at 10 days
      const finalBonus = trainingResult.bonus * (1 + workEthicBonus);

      // Calculate new stat value
      const newValue = Math.min(20, trainingResult.currentValue + finalBonus);

      // Update player stats and last training date
      const updateData = {
        [`stats.${trainingResult.trainedStat}`]: newValue,
        lastTrainingDate: new Date(),
        'stats.workEthic': Math.min(20, player.consecutiveConnections * 2), // 2 points per consecutive day
      };

      // Update player
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedPlayer) {
        throw new Error('Failed to update player');
      }

      return NextResponse.json({
        success: true,
        training: {
          stat: trainingResult.trainedStat,
          previousValue: trainingResult.currentValue,
          newValue: newValue,
          baseBonus: trainingResult.bonus,
          workEthicBonus: workEthicBonus,
          finalBonus: finalBonus,
        },
        player: updatedPlayer,
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