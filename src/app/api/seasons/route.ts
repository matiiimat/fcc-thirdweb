import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "../../lib/mongodb";
import SeasonModel from "../../models/Season";
import TeamModel from "../../models/Team";

// Validation schema for creating a new season
const createSeasonSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  minTeams: z.number().min(4).optional(),
  maxTeams: z.number().max(20).optional(),
  matchDayInterval: z.number().min(1).optional(),
});

// Validation schema for team registration
const registerTeamSchema = z.object({
  seasonId: z.string(),
  teamId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = createSeasonSchema.parse(body);

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    // Validate dates
    if (startDate <= new Date() || endDate <= startDate) {
      return NextResponse.json(
        { error: "Invalid date range" },
        { status: 400 }
      );
    }

    // Check for existing season with overlapping dates
    const existingSeason = await SeasonModel.findOne({
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
        { status: { $in: ['registration', 'ongoing'] } },
      ],
    });

    if (existingSeason) {
      return NextResponse.json(
        { error: "A season is already active or overlaps with these dates" },
        { status: 400 }
      );
    }

    // Create new season
    const season = await SeasonModel.create({
      name: validatedData.name,
      startDate,
      endDate,
      minTeams: validatedData.minTeams,
      maxTeams: validatedData.maxTeams,
      matchDayInterval: validatedData.matchDayInterval,
    });

    return NextResponse.json({ success: true, season });
  } catch (error) {
    console.error("Error creating season:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create season",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    let query = {};
    if (status) {
      query = { status };
    }

    const seasons = await SeasonModel.find(query).sort({ startDate: -1 });

    return NextResponse.json({ success: true, seasons });
  } catch (error) {
    console.error("Error fetching seasons:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch seasons",
      },
      { status: 500 }
    );
  }
}