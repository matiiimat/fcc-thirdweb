import { NextRequest, NextResponse } from "next/server";
import { getBotName } from "@/app/lib/botNames";
import { PLAYER_CONSTANTS } from "@/app/lib/constants";
import connectDB from "@/app/lib/mongodb";

const generateRandomStat = () => {
  return Math.floor(Math.random() * 4) + 3; // Random number between 3 and 6
};

const generateBot = (index: number) => {
  const botName = getBotName(index);
  const ethAddress = `0xbot${index.toString().padStart(40, "0")}`.toLowerCase();
  const stats = {
    strength: generateRandomStat(),
    stamina: generateRandomStat(),
    passing: generateRandomStat(),
    shooting: generateRandomStat(),
    defending: generateRandomStat(),
    speed: generateRandomStat(),
    positioning: generateRandomStat(),
    workEthic: generateRandomStat(),
  };

  return {
    playerName: botName,
    ethAddress,
    team: "Unassigned", // Always start as unassigned
    stats,
    xp: 0,
    lastTrainingDate: null,
    lastGameDate: null,
    lastGameResult: null,
    lastConnectionDate: new Date(),
    consecutiveConnections: 0,
  };
};

export async function GET(request: NextRequest) {
  try {
    const mongoose = await connectDB();
    if (!mongoose) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Check if we're looking for a specific bot address
    const url = new URL(request.url);
    const botAddress = url.searchParams.get('address');

    if (botAddress) {
      console.log("Looking for specific bot with address:", botAddress);
      // If looking for a specific bot, return it regardless of assignment status
      const bot = await mongoose.connection.db
        .collection("players")
        .findOne({
          ethAddress: { $regex: new RegExp(`^${botAddress}$`, 'i') }
        });

      console.log("Bot search result:", bot);

      if (!bot) {
        console.log("No bot found for address:", botAddress);
        return NextResponse.json(
          { error: "Bot not found" },
          { status: 404 }
        );
      }

      // Ensure consistent case in response
      bot.ethAddress = bot.ethAddress.toLowerCase();
      return NextResponse.json({ bots: [bot] });
    }

    // Otherwise, get only unassigned bots for scouting
    const existingBots = await mongoose.connection.db
      .collection("players")
      .find({
        ethAddress: /^0xbot/,
        team: "Unassigned" // Only return unassigned bots for scouting
      })
      .toArray();

    if (existingBots.length > 0) {
      // Ensure consistent case in response
      const normalizedBots = existingBots.map((bot: { ethAddress: string; [key: string]: any }) => ({
        ...bot,
        ethAddress: bot.ethAddress.toLowerCase()
      }));
      return NextResponse.json({ bots: normalizedBots });
    }

    // If no bots exist, create them
    const bots = Array.from({ length: 100 }, (_, i) => generateBot(i));

    // Insert bots into database
    await mongoose.connection.db
      .collection("players")
      .insertMany(bots);

    return NextResponse.json({ bots });
  } catch (error) {
    console.error("Error in GET /api/bots:", error);
    return NextResponse.json(
      { error: "Failed to generate bots" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { count = 100 } = await request.json();

    const mongoose = await connectDB();
    if (!mongoose) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Delete existing bots
    await mongoose.connection.db
      .collection("players")
      .deleteMany({ ethAddress: /^0xbot/ });

    // Create new bots
    const bots = Array.from({ length: count }, (_, i) => generateBot(i));

    // Insert bots into database
    await mongoose.connection.db
      .collection("players")
      .insertMany(bots);

    return NextResponse.json({ bots });
  } catch (error) {
    console.error("Error in POST /api/bots:", error);
    return NextResponse.json(
      { error: "Failed to generate bots" },
      { status: 500 }
    );
  }
}