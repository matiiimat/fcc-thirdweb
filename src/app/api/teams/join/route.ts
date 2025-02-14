import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import TeamModel from "../../../models/Team";
import PlayerModel from "../../../models/Player";

export async function POST(req: NextRequest) {
  try {
    const { teamName, playerAddress } = await req.json();

    if (!teamName || !playerAddress) {
      return NextResponse.json(
        { error: "Team name and player address are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if team exists
    const team = await TeamModel.findOne({ teamName });
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Check if player is already in a team
    const player = await PlayerModel.findOne({ ethAddress: playerAddress });
    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    if (player.team !== "No Team") {
      return NextResponse.json(
        { error: "Player is already in a team" },
        { status: 400 }
      );
    }

    // Add player to team
    if (!team.players.includes(playerAddress.toLowerCase())) {
      team.players.push(playerAddress.toLowerCase());
      await team.save();
    }

    // Update player's team
    player.team = teamName;
    await player.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error joining team:", error);
    return NextResponse.json(
      { error: "Failed to join team" },
      { status: 500 }
    );
  }
}