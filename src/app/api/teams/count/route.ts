import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import TeamModel from "@/app/models/Team";
import cache, { CACHE_KEYS } from "@/app/lib/serverCache";

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cacheKey = CACHE_KEYS.TEAM_COUNT;
    const cachedCount = cache.get(cacheKey);
    
    if (cachedCount !== undefined) {
      console.log('Team count found in cache:', cachedCount);
      return NextResponse.json({ count: cachedCount });
    }

    await connectDB();
    
    // Count all teams except the special "MatchSchedule" team
    const count = await TeamModel.countDocuments({
      teamName: { $ne: "MatchSchedule" }
    });
    
    // Cache the result for 5 minutes (300 seconds)
    cache.set(cacheKey, count, 300);
    
    console.log('Team count from database:', count);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting teams:", error);
    return NextResponse.json(
      { error: "Failed to count teams" },
      { status: 500 }
    );
  }
}