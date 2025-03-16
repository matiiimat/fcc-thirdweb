import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import PlayerModel from "../../../models/Player";
import TeamModel from "../../../models/Team";
import SeasonModel from "../../../models/Season";
import { z } from "zod";

// Validation schema for contract response
const contractResponseSchema = z.object({
  playerAddress: z.string(),
  action: z.enum(['accept', 'reject']),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = contractResponseSchema.parse(body);

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
      ethAddress: validatedData.playerAddress.toLowerCase(),
      'contract.status': 'pending'
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found or no pending contract" },
        { status: 404 }
      );
    }

    // Find the team
    const team = await TeamModel.findOne({ 
      teamName: player.team,
      captainAddress: captainAddress.toLowerCase()
    });

    if (!team) {
      return NextResponse.json(
        { error: "You are not the captain of this player's team" },
        { status: 403 }
      );
    }

    // Find the current season
    const currentSeason = await SeasonModel.findOne({ 
      status: { $in: ['registration', 'ongoing'] } 
    }).sort({ seasonNumber: -1 });

    if (!currentSeason) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 400 }
      );
    }

    if (validatedData.action === 'accept') {
      // Update the contract to active status
      player.contract.status = 'active';
      player.contract.startDate = new Date();
      
      // Calculate end date (for display purposes)
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (player.contract.durationInSeasons * 3)); // Assuming 3 months per season
      player.contract.endDate = endDate;
      
      await player.save();

      return NextResponse.json({ 
        success: true, 
        message: "Contract accepted successfully",
        contract: player.contract,
        transactionRequired: true,
        amount: player.contract.requestedAmount,
        playerAddress: player.ethAddress
      });
    } else {
      // Reject the contract
      player.contract.status = 'rejected';
      await player.save();

      return NextResponse.json({ 
        success: true, 
        message: "Contract rejected successfully"
      });
    }
  } catch (error) {
    console.error("Error responding to contract:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to respond to contract",
      },
      { status: 500 }
    );
  }
}