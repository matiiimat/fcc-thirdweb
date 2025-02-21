import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import TeamModel from "@/app/models/Team";
import PlayerModel from "@/app/models/Player";
import { TEAM_CONSTANTS } from "@/app/lib/constants";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ethAddress = req.headers.get("ethAddress")?.toLowerCase();
    if (!ethAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await req.json();
    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if team exists
    const team = await TeamModel.findById(teamId);
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

    // Check if player exists and their current team status
    const player = await PlayerModel.findOne({ ethAddress });
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
    if (!team.players.includes(ethAddress)) {
      team.players.push(ethAddress);
      await team.save();
    }

    // Update player's team
    player.team = team.teamName;
    await player.save();

    return NextResponse.json({ success: true, team: team.teamName });
  } catch (error) {
    console.error("Error joining team:", error);
    return NextResponse.json(
      { error: "Failed to join team" },
      { status: 500 }
    );
  }
}