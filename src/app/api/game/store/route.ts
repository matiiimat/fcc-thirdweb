import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import PlayerModel from "@/app/models/Player";

export async function POST(req: NextRequest) {
  try {
    const { playerId, item, selectedSkill } = await req.json();

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
        if (!selectedSkill) {
          return NextResponse.json(
            { error: "Skill selection is required for private trainer" },
            { status: 400 }
          );
        }
        // Set private trainer details
        player.privateTrainer = {
          selectedSkill,
          remainingSessions: 7
        };
        player.lastTrainingDate = null; // Allow immediate training
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
      privateTrainer: player.privateTrainer
    });
  } catch (error) {
    console.error("Store purchase error:", error);
    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}