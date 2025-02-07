import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { calculateTrainingResult, getActionCooldown, calculateWorkEthicChange } from '@/app/lib/game';
import { TRAINING_CONSTANTS, PLAYER_CONSTANTS } from '@/app/lib/constants';
import { authenticatePlayer } from '@/app/middleware/auth';
import { rateLimits } from '@/app/middleware/rateLimit';
import { validateSchema, trainSchema } from '@/app/lib/schemas';
import { runTransaction } from '@/app/lib/transactions';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimits.train();
    if (rateLimitResult.error) {
      return rateLimitResult.error;
    }

    // 2. Input validation
    const body = await req.json();
    const validationResult = validateSchema(trainSchema, body);
    if (validationResult.error) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error },
        { status: 400 }
      );
    }

    const { playerId } = validationResult.data;

    await connectDB();

    // 3. Authentication
    const authResult = await authenticatePlayer(playerId);
    if (authResult.error) {
      return authResult.error;
    }

    const player = authResult.player;

    // 4. Check cooldown
    const { onCooldown, remainingTime } = getActionCooldown(player.lastTrainingDate, true);
    if (onCooldown) {
      return NextResponse.json(
        { error: `Training is on cooldown. Time remaining: ${remainingTime}` },
        { status: 400 }
      );
    }

    // 5. Run training logic in transaction
    const result = await runTransaction(async (session) => {
      // Convert player stats to plain object and filter out Mongoose fields
      const statsObj = player.stats.toObject();
      const plainStats = {
        strength: statsObj.strength,
        stamina: statsObj.stamina,
        passing: statsObj.passing,
        shooting: statsObj.shooting,
        defending: statsObj.defending,
        speed: statsObj.speed,
        positioning: statsObj.positioning,
        workEthic: statsObj.workEthic,
      };

      let trainingResult;
      const now = new Date();
      
      // Calculate work ethic change
      const workEthicChange = calculateWorkEthicChange(
        player.lastTrainingDate,
        player.lastWorkDate,
        player.lastConnectionDate
      );
      
      // Calculate new work ethic value
      const newWorkEthic = Math.max(
        PLAYER_CONSTANTS.MIN_STAT_VALUE,
        Math.min(
          PLAYER_CONSTANTS.MAX_STAT_VALUE,
          player.stats.workEthic + workEthicChange
        )
      );

      let updateData: any = {
        lastTrainingDate: now,
        'stats.workEthic': newWorkEthic,
      };

      // Check if player has active private trainer
      if (player.privateTrainer?.selectedSkill && player.privateTrainer.remainingSessions > 0) {
        // Use the selected skill for training
        const selectedSkill = player.privateTrainer.selectedSkill as keyof typeof plainStats;
        const currentValue = plainStats[selectedSkill];
        trainingResult = {
          trainedStat: player.privateTrainer.selectedSkill,
          currentValue,
          bonus: 1 // Normal training bonus for focused training
        };

        // Decrease remaining sessions
        updateData['privateTrainer.remainingSessions'] = player.privateTrainer.remainingSessions - 1;

        // If this was the last session, reset the selected skill
        if (player.privateTrainer.remainingSessions === 1) {
          updateData['privateTrainer.selectedSkill'] = null;
        }
      } else {
        // Normal random training
        trainingResult = calculateTrainingResult(plainStats);
      }

      // Apply work ethic bonus based on consecutive connections
      const workEthicBonus = Math.min(player.consecutiveConnections / 10, 1); // Max 100% bonus at 10 days
      const finalBonus = trainingResult.bonus * (1 + workEthicBonus);

      // Calculate new stat value
      const newValue = Math.min(20, trainingResult.currentValue + finalBonus);

      // Add stat update to updateData
      updateData[`stats.${trainingResult.trainedStat}`] = newValue;

      // Update player within transaction
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        { $set: updateData },
        { new: true, runValidators: true, session }
      ).select('-__v');

      if (!updatedPlayer) {
        throw new Error('Failed to update player');
      }

      return {
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
      };
    });

    if (result.error) {
      return result.error;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json(
      { error: 'Failed to process training' },
      { status: 500 }
    );
  }
}