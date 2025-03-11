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

    const { teamId, teamName } = await req.json();
    
    await connectDB();

    // Check if team exists - try by ID first, then by name
    let team;
    if (teamId) {
      team = await TeamModel.findById(teamId);
    } else if (teamName) {
      team = await TeamModel.findOne({ teamName });
    }

    if (!teamId && !teamName) {
      return NextResponse.json(
        { error: "Team ID or name is required" },
        { status: 400 }
      );
    }
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Check if team is public
    if (!team.isPublic) {
      return NextResponse.json(
        { error: "This team is private and cannot be joined directly" },
        { status: 403 }
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

    // Check if player is already in a team
    // We check for both "No Team" and "Unassigned" for backward compatibility,
    // but "Unassigned" is the standard value going forward
    if (player.team !== "Unassigned" && player.team !== "No Team") {
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