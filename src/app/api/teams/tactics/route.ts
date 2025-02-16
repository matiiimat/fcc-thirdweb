import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import TeamModel from "../../../models/Team";
import { ITactic } from "../../../models/Team";

export async function GET(req: NextRequest) {
  try {
    const teamName = req.nextUrl.searchParams.get("teamName");
    if (!teamName) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const team = await TeamModel.findOne({ teamName });
    
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(team.tactics);
  } catch (error) {
    console.error("Error fetching team tactics:", error);
    return NextResponse.json(
      { error: "Failed to fetch team tactics" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { teamName, tactic, captainAddress } = await req.json();

    if (!teamName || !tactic || !captainAddress) {
      return NextResponse.json(
        { error: "Team name, tactic, and captain address are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const team = await TeamModel.findOne({ teamName });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Verify that the request is from the team captain
    if (team.captainAddress.toLowerCase() !== captainAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Only the team captain can update tactics" },
        { status: 403 }
      );
    }

    // Check if we're updating an existing tactic or adding a new one
    const existingTacticIndex = team.tactics.findIndex((t: ITactic) => t.name === tactic.name);
    
    if (existingTacticIndex !== -1) {
      // Update existing tactic
      team.tactics[existingTacticIndex] = tactic;
    } else {
      // Add new tactic
      if (team.tactics.length >= 3) {
        return NextResponse.json(
          { error: "Maximum number of tactics (3) reached" },
          { status: 400 }
        );
      }
      team.tactics.push(tactic);
    }

    await team.save();
    return NextResponse.json(team.tactics);
  } catch (error) {
    console.error("Error updating team tactics:", error);
    return NextResponse.json(
      { error: "Failed to update team tactics" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const teamName = req.nextUrl.searchParams.get("teamName");
    const tacticName = req.nextUrl.searchParams.get("tacticName");
    const captainAddress = req.nextUrl.searchParams.get("captainAddress");

    if (!teamName || !tacticName || !captainAddress) {
      return NextResponse.json(
        { error: "Team name, tactic name, and captain address are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const team = await TeamModel.findOne({ teamName });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Verify that the request is from the team captain
    if (team.captainAddress.toLowerCase() !== captainAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Only the team captain can delete tactics" },
        { status: 403 }
      );
    }

    team.tactics = team.tactics.filter((t: ITactic) => t.name !== tacticName);
    await team.save();

    return NextResponse.json(team.tactics);
  } catch (error) {
    console.error("Error deleting team tactic:", error);
    return NextResponse.json(
      { error: "Failed to delete team tactic" },
      { status: 500 }
    );
  }
}