import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Team from "@/app/models/Team";

// GET /api/teams/[id] - Get a team by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const team = await Team.findById(params.id);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}