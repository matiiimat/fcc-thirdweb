import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import PlayerModel from "../../../models/Player";
import { z } from "zod";

// Validation schema for contract payment
const contractPaymentSchema = z.object({
  playerAddress: z.string(),
  transactionHash: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = contractPaymentSchema.parse(body);

    // Find the player with the pending contract
    const player = await PlayerModel.findOne({
      ethAddress: validatedData.playerAddress.toLowerCase(),
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

    // Calculate end date (for display purposes)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (player.contract.durationInSeasons * 3)); // Assuming 3 months per season
    player.contract.endDate = endDate;

    // Store the transaction hash
    player.contract.transactionHash = validatedData.transactionHash;

    await player.save();

    return NextResponse.json({
      success: true,
      message: "Contract payment processed successfully",
      contract: player.contract
    });
  } catch (error) {
    console.error("Error processing contract payment:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process contract payment",
      },
      { status: 500 }
    );
  }
}