import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Player from "@/app/models/Player";
import { CACHE_KEYS, getFromCache, setInCache } from "@/app/lib/serverCache";

export async function GET() {
  try {
    const cached = getFromCache<{ players: unknown[] }>(CACHE_KEYS.LEADERBOARD);
    if (cached) return NextResponse.json(cached);

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

    const result = { players };
    setInCache(CACHE_KEYS.LEADERBOARD, result, 60);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}