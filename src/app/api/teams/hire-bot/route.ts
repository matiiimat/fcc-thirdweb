import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

// Helper function to ensure team name consistency across collections
async function updatePlayerTeam(
  db: any,
  playerAddress: string,
  teamId: ObjectId,
  teamName: string
) {
  // Update player's team name
  await db.collection("players").updateOne(
    { ethAddress: { $regex: new RegExp(`^${playerAddress}$`, 'i') } },
    { $set: { team: teamName } }
  );

  // Update team's players array
  await db.collection("teams").updateOne(
    { _id: teamId },
    { $addToSet: { players: playerAddress.toLowerCase() } }
  );
}

export async function POST(req: Request) {
  try {
    const { botAddress, captainAddress } = await req.json();

    if (!botAddress || !captainAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify this is actually a bot address (case-insensitive)
    if (!botAddress.toLowerCase().startsWith("0xbot")) {
      return NextResponse.json(
        { error: "Invalid bot address" },
        { status: 400 }
      );
    }

    const mongoose = await connectDB();
    if (!mongoose) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Verify captain status (case-insensitive)
    const team = await mongoose.connection.db
      .collection("teams")
      .findOne({
        captainAddress: {
          $regex: new RegExp(`^${captainAddress}$`, 'i')
        }
      });

    if (!team) {
      return NextResponse.json(
        { error: "Only team captains can hire bots" },
        { status: 403 }
      );
    }

    // Verify bot exists and is unassigned (case-insensitive)
    const bot = await mongoose.connection.db
      .collection("players")
      .findOne({
        ethAddress: { $regex: new RegExp(`^${botAddress}$`, 'i') },
        team: "Unassigned"
      });

    if (!bot) {
      return NextResponse.json(
        { error: "Bot not found or already assigned" },
        { status: 404 }
      );
    }

    // Get the actual team document using ObjectId
    const teamDoc = await mongoose.connection.db
      .collection("teams")
      .findOne({ _id: new ObjectId(team._id) });

    if (!teamDoc) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Normalize addresses
    const normalizedBotAddress = bot.ethAddress.toLowerCase();

    // Use the helper function to ensure consistency
    await updatePlayerTeam(
      mongoose.connection.db,
      normalizedBotAddress,
      teamDoc._id,
      teamDoc.teamName
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error hiring bot:", error);
    return NextResponse.json(
      { error: "Failed to hire bot" },
      { status: 500 }
    );
  }
}