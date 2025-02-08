import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { authenticatePlayer } from '@/app/middleware/auth';
import { rateLimits } from '@/app/middleware/rateLimit';
import { validateSchema, playerIdSchema } from '@/app/lib/schemas';
import { runTransaction } from '@/app/lib/transactions';
import { TRAINING_CONSTANTS } from '@/app/lib/constants';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimits.solomatch();
    if (rateLimitResult.error) {
      return rateLimitResult.error;
    }

    // 2. Input validation
    const body = await req.json();
    const validationResult = validateSchema(playerIdSchema, body);
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
    const now = new Date();
    const lastGameDate = player.lastGameDate ? new Date(player.lastGameDate) : null;
    
    if (lastGameDate) {
      const timeSinceLastGame = now.getTime() - lastGameDate.getTime();
      const cooldownMs = TRAINING_CONSTANTS.GAME_COOLDOWN_HOURS * 60 * 60 * 1000;
      
      if (timeSinceLastGame < cooldownMs) {
        const remainingHours = Math.ceil((cooldownMs - timeSinceLastGame) / (60 * 60 * 1000));
        return NextResponse.json(
          { error: `Game is on cooldown. Please wait ${remainingHours} hours before playing again.` },
          { status: 400 }
        );
      }
    }

    // 5. Run game logic in transaction
    const result = await runTransaction(async (session) => {
      // TODO: Implement actual game logic here
      // For now, just update lastGameDate and add a placeholder result
      const gameResult = {
        score: Math.floor(Math.random() * 5),
        opponent: "AI Opponent",
        result: Math.random() > 0.5 ? "win" : "loss"
      };

      // Update player with game result
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        {
          $set: {
            lastGameDate: now,
            lastGameResult: gameResult
          }
        },
        { new: true, runValidators: true, session }
      ).select('-__v');

      if (!updatedPlayer) {
        throw new Error('Failed to update player');
      }

      return {
        success: true,
        player: updatedPlayer
      };
    });

    if (result.error) {
      return result.error;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Solo match error:', error);
    return NextResponse.json(
      { error: 'Failed to process game' },
      { status: 500 }
    );
  }
}