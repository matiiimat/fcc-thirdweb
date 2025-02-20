import { NextRequest, NextResponse } from "next/server";
import { getBotName } from "@/app/lib/botNames";
import { PLAYER_CONSTANTS } from "@/app/lib/constants";
import connectDB from "@/app/lib/mongodb";

const generateRandomStat = () => {
  return Math.floor(Math.random() * 4) + 3; // Random number between 3 and 6
};

const generateBot = (index: number) => {
  if (typeof index !== 'number' || isNaN(index)) {
    throw new Error(`Invalid index: ${index}`);
  }

  // Ensure index is a non-negative integer
  const safeIndex = Math.max(0, Math.floor(index));
  
  // Get name from the bot names array
  const botName = getBotName(safeIndex);
  
  // Format ethAddress to ensure it's exactly 42 characters (0x + 40 chars)
  const paddedIndex = safeIndex.toString().padStart(38, "0"); // 38 because "0xbot" takes 4 chars
  const ethAddress = `0xbot${paddedIndex}`.toLowerCase();
  
  // Create a unique playerId
  const playerId = `bot_${safeIndex}`;
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
    playerId, // Add playerId to the returned object
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
    privateTrainer: { // Add required privateTrainer field
      selectedSkill: null,
      remainingSessions: 0
    }
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

    // Validate count
    const safeCount = Math.min(Math.max(1, Math.floor(count)), 1000); // Limit between 1 and 1000

    const mongoose = await connectDB();
    if (!mongoose) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Find highest indices from both playerId and ethAddress separately
    const [highestBotById, highestBotByAddress] = await Promise.all([
      mongoose.connection.db
        .collection("players")
        .find({ playerId: /^bot_\d+$/ })
        .sort({ playerId: -1 })
        .limit(1)
        .toArray(),
      mongoose.connection.db
        .collection("players")
        .find({ ethAddress: /^0xbot/ })
        .sort({ ethAddress: -1 })
        .limit(1)
        .toArray()
    ]);

    // Extract indices
    let startIndex = 0;
    
    if (highestBotById.length > 0) {
      const idMatch = highestBotById[0].playerId.match(/^bot_(\d+)$/);
      if (idMatch) {
        startIndex = Math.max(startIndex, parseInt(idMatch[1]));
      }
    }
    
    if (highestBotByAddress.length > 0) {
      const addressMatch = highestBotByAddress[0].ethAddress.match(/^0xbot0*(\d+)$/);
      if (addressMatch) {
        startIndex = Math.max(startIndex, parseInt(addressMatch[1]));
      }
    }

    // Increment to get the next available index
    startIndex += 1;

    // Generate bots
    const bots = [];
    for (let i = 0; i < safeCount; i++) {
      try {
        const bot = generateBot(startIndex + i);
        bots.push(bot);
      } catch (error) {
        console.error(`Failed to generate bot at index ${startIndex + i}:`, error);
        continue;
      }
    }

    if (bots.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any valid bots" },
        { status: 500 }
      );
    }

    // Insert bots into database
    await mongoose.connection.db
      .collection("players")
      .insertMany(bots);

    return NextResponse.json({
      success: true,
      count: bots.length,
      bots
    });
  } catch (error) {
    console.error("Error in POST /api/bots:", error);
    // More detailed error response
    return NextResponse.json(
      {
        error: "Failed to generate bots",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}