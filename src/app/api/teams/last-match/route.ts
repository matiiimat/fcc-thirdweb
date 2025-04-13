import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("teamName");

    if (!teamName) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const matches = db.collection("matches");

    // Find the most recent match where the team participated
    const lastMatch = await matches
      .find({
        $or: [
          { "homeTeam.teamName": teamName },
          { "awayTeam.teamName": teamName },
        ],
      })
      .sort({ date: -1 })
      .limit(1)
      .toArray();

    if (!lastMatch || lastMatch.length === 0) {
      return NextResponse.json(
        { error: "No matches found for this team" },
        { status: 404 }
      );
    }

    return NextResponse.json(lastMatch[0]);
  } catch (error) {
    console.error("Error fetching last match:", error);
    return NextResponse.json(
      { error: "Failed to fetch last match" },
      { status: 500 }
    );
  }
} 