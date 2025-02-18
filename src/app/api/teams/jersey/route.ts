import { NextRequest, NextResponse } from "next/server";
import TeamModel, { IJersey } from "../../../models/Team";
import connectDB from "../../../lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { teamName, captainAddress, jersey } = await req.json();

    if (!teamName || !captainAddress || !jersey) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
        { error: "Only the team captain can update the jersey" },
        { status: 403 }
      );
    }

    // Update jersey
    team.jersey = jersey as IJersey;
    await team.save();

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error updating team jersey:", error);
    return NextResponse.json(
      { error: "Failed to update team jersey" },
      { status: 500 }
    );
  }
}