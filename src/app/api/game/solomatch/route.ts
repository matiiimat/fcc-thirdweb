import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player, { Position } from '@/app/models/Player';
import { authenticatePlayer } from '@/app/middleware/auth';
import { rateLimits } from '@/app/middleware/rateLimit';
import { validateSchema } from '@/app/lib/schemas';
import { runTransaction } from '@/app/lib/transactions';
import { TRAINING_CONSTANTS } from '@/app/lib/constants';
import { z } from 'zod';

const solomatchSchema = z.object({
  playerId: z.string(),
  position: z.enum(['D', 'M', 'F'])
});

type GameRequest = {
  playerId: string;
  position: Position;
};

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimits.solomatch();
    if (rateLimitResult.error) {
      return rateLimitResult.error;
    }

    // 2. Input validation
    const body = await req.json();
    const validationResult = validateSchema(solomatchSchema, body);
    if (validationResult.error) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error },
        { status: 400 }
      );
    }

    const { playerId, position } = validationResult.data as GameRequest;

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
      // Update player with new game date
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        {
          $set: {
            lastGameDate: now
          }
        },
        { 
          new: true, 
          runValidators: true, 
          session,
          lean: true // Use lean to get a plain JavaScript object
        }
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