import { NextRequest, NextResponse } from "next/server";
import TeamModel from "../../../models/Team";
import connectDB from "../../../lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const { teamName, captainAddress, isPublic } = await request.json();

    if (!teamName || !captainAddress) {
      return NextResponse.json(
        { error: "Team name and captain address are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the team and verify captain
    const team = await TeamModel.findOne({ teamName });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.captainAddress.toLowerCase() !== captainAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Only team captain can update visibility" },
        { status: 403 }
      );
    }

    // Update team visibility
    team.isPublic = isPublic;
    await team.save();

    return NextResponse.json({ message: "Team visibility updated successfully" });
  } catch (error) {
    console.error("Error updating team visibility:", error);
    return NextResponse.json(
      { error: "Failed to update team visibility" },
      { status: 500 }
    );
  }
}