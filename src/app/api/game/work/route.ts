import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import PlayerModel from "@/app/models/Player";
import { getActionCooldown, calculateWorkEthicChange } from "@/app/lib/game";
import { PLAYER_CONSTANTS } from "@/app/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { playerId } = await req.json();

    if (!playerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const player = await PlayerModel.findOne({ playerId });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Check if player can work (8-hour cooldown)
    const { onCooldown, remainingTime } = getActionCooldown(player.lastWorkDate, false);

    if (onCooldown) {
      return NextResponse.json(
        { error: `Work is on cooldown. Time remaining: ${remainingTime}` },
        { status: 400 }
      );
    }

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

    // Update player
    player.money += earnedAmount;
    player.lastWorkDate = now;
    player.stats.workEthic = newWorkEthic;

    await player.save();

    return NextResponse.json({
      success: true,
      earnedAmount,
      player: {
        ...player.toJSON(),
        money: player.money,
      },
    });
  } catch (error) {
    console.error("Work error:", error);
    return NextResponse.json(
      { error: "Failed to process work" },
      { status: 500 }
    );
  }
}