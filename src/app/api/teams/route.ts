import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import TeamModel from "../../models/Team";
import PlayerModel from "../../models/Player";

export async function POST(req: NextRequest) {
  try {
    const { teamName, captainAddress } = await req.json();

    if (!teamName || !captainAddress) {
      return NextResponse.json(
        { error: "Team name and captain address are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if team name already exists
    const existingTeam = await TeamModel.findOne({ teamName });
    if (existingTeam) {
      return NextResponse.json(
        { error: "Team name already exists" },
        { status: 400 }
      );
    }

    // Create new team
    const team = new TeamModel({
      teamName,
      captainAddress,
      players: [captainAddress], // Captain is automatically a player
    });

    await team.save();

    // Update captain's player record
    await PlayerModel.findOneAndUpdate(
      { ethAddress: captainAddress },
      { team: teamName }
    );

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const teams = await TeamModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}