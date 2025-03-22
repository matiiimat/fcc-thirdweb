import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Team from "@/app/models/Team";
import cache, { CACHE_KEYS, setInCache } from "@/app/lib/serverCache";

// GET /api/teams/[id] - Get a team by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id;
    
    // Check cache first
    const cacheKey = CACHE_KEYS.TEAM(teamId);
    const cachedTeam = cache.get(cacheKey);
    
    if (cachedTeam) {
      console.log('Team found in cache:', teamId);
      return NextResponse.json(cachedTeam);
    }
    
    await connectDB();

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Cache the team data (120 seconds TTL)
    const teamData = team.toObject();
    setInCache(cacheKey, teamData, 120);
    
    return NextResponse.json(teamData);
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
    const teamId = params.id;
    await connectDB();

    const body = await req.json();
    
    // Find the team
    const team = await Team.findById(teamId);
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
    
    // Invalidate team cache
    cache.del(CACHE_KEYS.TEAM(teamId));
    cache.del(CACHE_KEYS.TEAM_BY_NAME(team.teamName));
    
    // Invalidate team leaderboard cache as team stats might have changed
    cache.del(CACHE_KEYS.TEAM_LEADERBOARD);
    
    const teamData = team.toObject();
    
    return NextResponse.json({
      message: "Team updated successfully",
      team: teamData
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
    const teamId = params.id;
    await connectDB();

    // First find the team to get its players
    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Import Player model
    const Player = (await import("@/app/models/Player")).default;

    // Get all players in this team to invalidate their caches later
    const players = await Player.find({ team: team.teamName });

    // Update all players in this team to be unassigned
    await Player.updateMany(
      { team: team.teamName },
      { $set: { team: "Unassigned" } }
    );

    // Now delete the team
    await Team.findByIdAndDelete(teamId);
    
    // Invalidate team cache
    cache.del(CACHE_KEYS.TEAM(teamId));
    cache.del(CACHE_KEYS.TEAM_BY_NAME(team.teamName));
    
    // Invalidate team leaderboard cache
    cache.del(CACHE_KEYS.TEAM_LEADERBOARD);
    
    // Invalidate player caches for all affected players
    players.forEach(player => {
      cache.del(CACHE_KEYS.PLAYER(player._id.toString()));
      cache.del(CACHE_KEYS.PLAYER_BY_ADDRESS(player.ethAddress));
    });
    
    // Invalidate player leaderboard cache
    cache.del(CACHE_KEYS.LEADERBOARD);

    return NextResponse.json({ message: "Team deleted successfully and players unassigned" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}