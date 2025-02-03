import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import PlayerModel from "@/app/models/Player";

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

    // Check if player can work/train today
    const today = new Date().toDateString();
    const lastTrainingDate = player.lastTrainingDate
      ? new Date(player.lastTrainingDate).toDateString()
      : null;

    if (lastTrainingDate === today) {
      return NextResponse.json(
        { error: "Already trained or worked today" },
        { status: 400 }
      );
    }

    // Add work money and update last training date
    player.money += 200;
    player.lastTrainingDate = new Date();

    await player.save();

    return NextResponse.json({
      success: true,
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