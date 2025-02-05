import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import PlayerModel from "@/app/models/Player";
import { getActionCooldown } from "@/app/lib/game";

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

    // Add work money and update last work date
    player.money += earnedAmount;
    player.lastWorkDate = new Date();

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