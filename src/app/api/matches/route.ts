import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import MatchModel from "../../models/Match";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");
    const seasonId = searchParams.get("seasonId");
    const status = searchParams.get("status"); // 'completed' or 'upcoming'
    const matchday = searchParams.get("matchday");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");

    // Build query based on parameters
    const query: any = {};

    if (teamId) {
      query.$or = [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ];
    }

    if (seasonId) {
      query.seasonId = seasonId;
    }

    if (matchday) {
      query.matchday = parseInt(matchday);
    }

    if (status === 'completed') {
      query.isCompleted = true;
    } else if (status === 'upcoming') {
      query.isCompleted = false;
      query.scheduledDate = { $gt: new Date() };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalMatches = await MatchModel.countDocuments(query);

    // Get matches with pagination
    const matches = await MatchModel.find(query)
      .sort({ scheduledDate: status === 'completed' ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      matches,
      pagination: {
        total: totalMatches,
        page,
        totalPages: Math.ceil(totalMatches / limit),
        hasMore: skip + matches.length < totalMatches,
      },
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch matches",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Matches can only be created through the season system" },
    { status: 400 }
  );
}