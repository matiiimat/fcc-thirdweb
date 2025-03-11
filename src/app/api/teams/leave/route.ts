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

    // Check if player is in the team
    if (!team.players.includes(playerAddress.toLowerCase())) {
      return NextResponse.json(
        { error: "Player is not in this team" },
        { status: 400 }
      );
    }

    // Don't allow captain to leave the team
    if (team.captainAddress.toLowerCase() === playerAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Team captain cannot leave the team" },
        { status: 400 }
      );
    }

    // Remove player from team
    team.players = team.players.filter(
      (player: string) => player.toLowerCase() !== playerAddress.toLowerCase()
    );
    await team.save();

    // Update player's team status
    await PlayerModel.findOneAndUpdate(
      { ethAddress: playerAddress },
      { team: "Unassigned" }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving team:", error);
    return NextResponse.json(
      { error: "Failed to leave team" },
      { status: 500 }
    );
  }
}