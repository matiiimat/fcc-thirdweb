import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import PlayerModel from "@/app/models/Player";

export async function POST(req: NextRequest) {
  try {
    const { playerId, item } = await req.json();

    if (!playerId || !item) {
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

    // Check if player has enough money
    if (player.money < item.price) {
      return NextResponse.json(
        { error: "Insufficient funds in cash account" },
        { status: 400 }
      );
    }

    // Update player's money
    player.money -= item.price;

    // Add any specific effects based on the item
    switch (item.id) {
      case "private_trainer":
        // Set last training date to null to allow immediate training
        player.lastTrainingDate = null;
        break;
      case "management_certificate":
      case "training_certificate":
      case "finance_certificate":
        // These will be used in future features
        break;
      default:
        return NextResponse.json(
          { error: "Invalid item" },
          { status: 400 }
        );
    }

    await player.save();

    return NextResponse.json({
      success: true,
      newBalance: player.money,
    });
  } catch (error) {
    console.error("Store purchase error:", error);
    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}