import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import PlayerModel from "../../../models/Player";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get player's ETH address from the request headers
    const playerAddress = request.headers.get("x-wallet-address");
    if (!playerAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 401 }
      );
    }

    // Find the player
    const player = await PlayerModel.findOne({
      ethAddress: playerAddress.toLowerCase()
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Check if player has a pending contract
    if (!player.contract || player.contract.status !== 'pending') {
      return NextResponse.json(
        { error: "No pending contract request found" },
        { status: 400 }
      );
    }

    // Remove the contract request
    player.contract = undefined;
    await player.save();

    return NextResponse.json({ 
      success: true, 
      message: "Contract request cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling contract request:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to cancel contract request",
      },
      { status: 500 }
    );
  }
}