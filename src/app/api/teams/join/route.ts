import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import TeamModel from "../../../models/Team";
import PlayerModel from "../../../models/Player";
import { TEAM_CONSTANTS } from "../../../lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { teamName, playerAddress } = await req.json();
    console.log('Received request:', { teamName, playerAddress });

    if (!teamName || !playerAddress) {
      console.log('Missing required fields:', { teamName, playerAddress });
      return NextResponse.json(
        { error: "Team name and player address are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if team exists
    const team = await TeamModel.findOne({ teamName });
    console.log('Found team:', team);
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Check if team is full
    if (team.players.length >= TEAM_CONSTANTS.MAX_PLAYERS) {
      return NextResponse.json(
        { error: `Team is full (maximum ${TEAM_CONSTANTS.MAX_PLAYERS} players)` },
        { status: 400 }
      );
    }

    // Check if player is already in a team
    const player = await PlayerModel.findOne({ ethAddress: playerAddress.toLowerCase() });
    console.log('Found player:', player);
    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    if (player.team !== "No Team" && player.team !== "Unassigned") {
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