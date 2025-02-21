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

    // Verify captain status and bot belongs to team
    const team = await mongoose.connection.db
      .collection("teams")
      .findOne({ 
        captainAddress: captainAddress.toLowerCase(),
        players: botAddress
      });

    if (!team) {
      return NextResponse.json(
        { error: "Only team captains can fire their own bots" },
        { status: 403 }
      );
    }

    // Verify bot exists and is on the team
    const bot = await mongoose.connection.db
      .collection("players")
      .findOne({
        ethAddress: botAddress,
        team: team.teamName
      });

    if (!bot) {
      return NextResponse.json(
        { error: "Bot not found or not on team" },
        { status: 404 }
      );
    }

    // Update bot's team to Unassigned
    await mongoose.connection.db
      .collection("players")
      .updateOne(
        { ethAddress: botAddress },
        { $set: { team: "Unassigned" } }
      );

    // Remove bot from team's players
    await mongoose.connection.db
      .collection("teams")
      .updateOne(
        { _id: new ObjectId(team._id) },
        { $pull: { players: botAddress } }
      );

    // Remove bot from any tactics
    await mongoose.connection.db
      .collection("teams")
      .updateOne(
        { _id: new ObjectId(team._id) },
        { 
          $set: {
            "tactics.$[].playerPositions": {
              $filter: {
                input: "$tactics.$[].playerPositions",
                cond: { $ne: ["$$this.ethAddress", botAddress] }
              }
            }
          }
        }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error firing bot:", error);
    return NextResponse.json(
      { error: "Failed to fire bot" },
      { status: 500 }
    );
  }
}