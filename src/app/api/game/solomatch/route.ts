import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player, { Position } from '@/app/models/Player';
import { authenticatePlayer } from '@/app/middleware/auth';
import { rateLimits } from '@/app/middleware/rateLimit';
import { validateSchema } from '@/app/lib/schemas';
import { runTransaction } from '@/app/lib/transactions';
import { TRAINING_CONSTANTS } from '@/app/lib/constants';
import { z } from 'zod';
import { generateMatchEvents } from '@/app/components/MatchEvents';

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

    // 5. Generate match events and calculate rating
    const events = generateMatchEvents(position, player.playerName);
    
    // Count player name mentions and goals
    let playerNameMentions = 0;
    let playerScored = false;
    
    events.forEach(event => {
      if (event.text.includes(player.playerName)) {
        playerNameMentions++;
      }
      if (event.type === 'goal' && event.team === 'player' && event.text.includes(player.playerName)) {
        playerScored = true;
      }
    });

    // Calculate base rating (5.0-8.0 or 8.0-10.0 if scored)
    const minRating = playerScored ? 8.0 : 5.0;
    const maxRating = playerScored ? 10.0 : 8.0;
    const ratingRange = maxRating - minRating;
    
    // Calculate rating based on player involvement (mentions)
    // More mentions = higher rating within the range
    const maxPossibleMentions = 15; // Based on match event generation logic
    const ratingFromMentions = Math.min(playerNameMentions / maxPossibleMentions, 1);
    const rating = minRating + (ratingRange * ratingFromMentions);
    const finalRating = Math.round(rating * 10) / 10; // Round to 1 decimal

    // Calculate XP gained (rating * 10)
    const xpGained = Math.round(finalRating * 10);

    // 6. Run game logic in transaction
    const result = await runTransaction(async (session) => {
      // Update player with new game date and XP
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        {
          $set: {
            lastGameDate: now
          },
          $inc: {
            xp: xpGained
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
        player: updatedPlayer,
        matchResult: {
          events,
          rating: finalRating,
          xpGained
        }
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