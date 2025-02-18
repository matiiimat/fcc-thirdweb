import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Player from "@/app/models/Player";

export async function GET() {
  try {
    await connectDB();

    // Get top 100 players sorted by XP, excluding players with NaN XP
    const players = await Player.aggregate([
      {
        $match: {
          xp: { $type: "number", $ne: NaN }
        }
      },
      {
        $project: {
          playerName: 1,
          xp: 1
        }
      },
      { $sort: { xp: -1 } },
      { $limit: 100 }
    ]);

    return NextResponse.json({ players });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}