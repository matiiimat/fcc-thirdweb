import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import PlayerModel from "@/app/models/Player";
import { getActionCooldown, calculateWorkEthicChange } from "@/app/lib/game";
import { PLAYER_CONSTANTS } from "@/app/lib/constants";
import { authenticatePlayer } from "@/app/middleware/auth";
import { rateLimits } from "@/app/middleware/rateLimit";
import { validateSchema, workSchema } from "@/app/lib/schemas";
import { runTransaction } from "@/app/lib/transactions";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimits.work();
    if (rateLimitResult.error) {
      return rateLimitResult.error;
    }

    // 2. Input validation
    const body = await req.json();
    const validationResult = validateSchema(workSchema, body);
    if (validationResult.error) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error },
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
    const { onCooldown, remainingTime } = getActionCooldown(player.lastWorkDate, false);
    if (onCooldown) {
      return NextResponse.json(
        { error: `Work is on cooldown. Time remaining: ${remainingTime}` },
        { status: 400 }
      );
    }

    // 5. Run work logic in transaction
    const result = await runTransaction(async (session) => {
      // Generate random work reward between 150 and 250
      const earnedAmount = Math.floor(Math.random() * (250 - 150 + 1)) + 150;

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

      // Update player within transaction
      const updatedPlayer = await PlayerModel.findOneAndUpdate(
        { playerId },
        {
          $set: {
            lastWorkDate: now,
            'stats.workEthic': newWorkEthic,
          },
          $inc: { money: earnedAmount }
        },
        { new: true, runValidators: true, session }
      ).select('-__v');

      if (!updatedPlayer) {
        throw new Error('Failed to update player');
      }

      return {
        success: true,
        earnedAmount,
        player: updatedPlayer,
      };
    });

    if (result.error) {
      return result.error;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Work error:", error);
    return NextResponse.json(
      { error: "Failed to process work" },
      { status: 500 }
    );
  }
}