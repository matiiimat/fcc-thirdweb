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

// PATCH /api/teams/[id] - Update a team by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await req.json();
    
    // Find the team
    const team = await Team.findById(params.id);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Update the team with the provided data
    if (body.stats) {
      team.stats = body.stats;
    }

    // Add other fields that can be updated here
    if (body.matches) {
      team.matches = body.matches;
    }

    // Save the updated team
    await team.save();

    return NextResponse.json({ 
      message: "Team updated successfully",
      team
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete a team by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // First find the team to get its players
    const team = await Team.findById(params.id);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Import Player model
    const Player = (await import("@/app/models/Player")).default;

    // Update all players in this team to be unassigned
    await Player.updateMany(
      { team: team.teamName },
      { $set: { team: "Unassigned" } }
    );

    // Now delete the team
    await Team.findByIdAndDelete(params.id);

    return NextResponse.json({ message: "Team deleted successfully and players unassigned" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}