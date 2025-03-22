import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import PlayerModel from "../../../models/Player";
import { z } from "zod";

// Validation schema for contract payment confirmation
const contractPaymentSchema = z.object({
  playerId: z.string(),
  transactionHash: z.string(),
  durationInSeasons: z.number().int().min(1).max(5),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = contractPaymentSchema.parse(body);

    // Get captain's ETH address from the request headers
    const captainAddress = request.headers.get("x-wallet-address");
    if (!captainAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 401 }
      );
    }

    // Find the player with the pending contract
    const player = await PlayerModel.findOne({ 
      _id: validatedData.playerId,
      'contract.status': 'pending'
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found or no pending contract" },
        { status: 404 }
      );
    }

    // Update the contract to active status
    player.contract.status = 'active';
    player.contract.startDate = new Date();
    player.contract.transactionHash = validatedData.transactionHash;
    
    // Calculate end date (for display purposes)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (validatedData.durationInSeasons * 3)); // Assuming 3 months per season
    player.contract.endDate = endDate;
    
    await player.save();

    return NextResponse.json({ 
      success: true, 
      message: "Contract activated successfully",
      contract: player.contract
    });
  } catch (error) {
    console.error("Error confirming contract payment:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to confirm contract payment",
      },
      { status: 500 }
    );
  }
}