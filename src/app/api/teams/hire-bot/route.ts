import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const { botAddress, captainAddress } = await req.json();

    if (!botAddress || !captainAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify this is actually a bot address
    if (!botAddress.startsWith("0xbot")) {
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

    // Verify captain status
    const team = await mongoose.connection.db
      .collection("teams")
      .findOne({ captainAddress: captainAddress.toLowerCase() });

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

    // Update bot's team using the original case from the database
    await mongoose.connection.db
      .collection("players")
      .updateOne(
        { ethAddress: { $regex: new RegExp(`^${botAddress}$`, 'i') } },
        { $set: { team: team.teamName } }
      );

    // Add bot to team's players using the stored case
    await mongoose.connection.db
      .collection("teams")
      .updateOne(
        { _id: new ObjectId(team._id) },
        { $addToSet: { players: bot.ethAddress } } // Use the case from the database
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