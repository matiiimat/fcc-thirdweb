import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import SeasonModel from "../../../models/Season";
import PlayerModel from "../../../models/Player";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { seasonId } = body;

    if (!seasonId) {
      return NextResponse.json(
        { error: "Season ID is required" },
        { status: 400 }
      );
    }

    // Find the season
    const season = await SeasonModel.findById(seasonId);
    if (!season) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      );
    }

    // Check if the season is in registration status
    if (season.status !== 'registration') {
      return NextResponse.json(
        { error: "Only seasons in registration status can be activated" },
        { status: 400 }
      );
    }

    // Activate the season
    await season.activateSeason();

    // Update player contracts to increment the season
    await PlayerModel.updateMany(
      { 'contract.status': 'active' },
      { $inc: { 'contract.seasonEnds': 1 } }
    );

    // Check for expired contracts
    const playersWithExpiredContracts = await PlayerModel.find({
      'contract.status': 'active',
      'contract.seasonEnds': { $lte: season.seasonNumber }
    });

    // Mark contracts as expired
    for (const player of playersWithExpiredContracts) {
      player.contract.status = 'expired';
      player.contract.endDate = new Date();
      await player.save();
    }

    return NextResponse.json({ 
      success: true, 
      message: "Season activated successfully",
      season
    });
  } catch (error) {
    console.error("Error activating season:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to activate season",
      },
      { status: 500 }
    );
  }
}