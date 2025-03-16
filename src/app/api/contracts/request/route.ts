import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import PlayerModel from "../../../models/Player";
import TeamModel from "../../../models/Team";
import SeasonModel from "../../../models/Season";
import { z } from "zod";

// Validation schema for contract request
const contractRequestSchema = z.object({
  requestedAmount: z.number().min(0.001),
  durationInSeasons: z.number().int().min(1).max(5),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = contractRequestSchema.parse(body);

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

    // Check if player has a team
    if (!player.team || player.team === "Unassigned") {
      return NextResponse.json(
        { error: "You must be part of a team to request a contract" },
        { status: 400 }
      );
    }

    // Check if player already has an active or pending contract
    if (player.contract && (player.contract.status === 'active' || player.contract.status === 'pending')) {
      return NextResponse.json(
        { error: "You already have an active or pending contract" },
        { status: 400 }
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

    // Create the contract request
    player.contract = {
      requestedAmount: validatedData.requestedAmount,
      durationInSeasons: validatedData.durationInSeasons,
      status: 'pending',
      startDate: null,
      endDate: null,
      seasonStarted: currentSeason.seasonNumber,
      seasonEnds: currentSeason.seasonNumber + validatedData.durationInSeasons
    };

    await player.save();

    // Find the team captain to notify them
    const team = await TeamModel.findOne({ teamName: player.team });
    if (team) {
      // TODO: Add notification for team captain about contract request
    }

    return NextResponse.json({ 
      success: true, 
      message: "Contract request submitted successfully",
      contract: player.contract
    });
  } catch (error) {
    console.error("Error requesting contract:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to request contract",
      },
      { status: 500 }
    );
  }
}