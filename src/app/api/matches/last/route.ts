import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import MatchModel from "../../../models/Match";
import { Types } from "mongoose";
import { IMatch } from "../../../models/Match";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Find the last completed match for the team
    const lastMatch = await MatchModel.findOne({
      $or: [
        { homeTeamId: new Types.ObjectId(teamId) },
        { awayTeamId: new Types.ObjectId(teamId) }
      ],
      isCompleted: true
    })
    .sort({ scheduledDate: -1 })
    .limit(1);

    if (!lastMatch) {
      return NextResponse.json(
        { error: "No completed matches found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ match: lastMatch });
  } catch (error) {
    console.error("Error fetching last match:", error);
    return NextResponse.json(
      { error: "Failed to fetch last match" },
      { status: 500 }
    );
  }
} 