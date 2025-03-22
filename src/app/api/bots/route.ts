import { NextRequest, NextResponse } from "next/server";
import { getBotName } from "@/app/lib/botNames";
import { PLAYER_CONSTANTS } from "@/app/lib/constants";
import connectDB from "@/app/lib/mongodb";

// Generate a balanced set of stats with a total of exactly 10 points
// and no stat exceeding 3 points
const generateBalancedStats = () => {
  // Initialize all stats to 0
  const stats = {
    strength: 0,
    stamina: 0,
    passing: 0,
    shooting: 0,
    defending: 0,
    speed: 0,
    positioning: 0,
    workEthic: 0,
  };
  
  // We need to distribute exactly 10 points
  let remainingPoints = 10;
  
  // Get all stat keys
  const statKeys = Object.keys(stats) as Array<keyof typeof stats>;
  
  // First pass: randomly distribute points while respecting max of 3 per stat
  while (remainingPoints > 0) {
    // Pick a random stat
    const randomStatIndex = Math.floor(Math.random() * statKeys.length);
    const randomStat = statKeys[randomStatIndex];
    
    // If this stat is already at max (3), skip it
    if (stats[randomStat] >= 3) {
      continue;
    }
    
    // Add 1 point to this stat
    stats[randomStat]++;
    remainingPoints--;
  }
  
  return stats;
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
  
  // Generate balanced stats (total of 10 points, max 3 per stat)
  const stats = generateBalancedStats();

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

// Update existing bot stats to match new balanced requirements
const updateExistingBotStats = async (mongoose: any) => {
  try {
    // Find all bots
    const allBots = await mongoose.connection.db
      .collection("players")
      .find({
        ethAddress: /^0xbot/
      })
      .toArray();
    
    // Update each bot's stats
    for (const bot of allBots) {
      // Generate new balanced stats
      const newStats = generateBalancedStats();
      
      // Update the bot in the database
      await mongoose.connection.db
        .collection("players")
        .updateOne(
          { _id: bot._id },
          { $set: { stats: newStats } }
        );
    }
    
    console.log(`Updated stats for ${allBots.length} bots`);
    return allBots.length;
  } catch (error) {
    console.error("Error updating bot stats:", error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/bots: Starting request");
    
    const mongoose = await connectDB();
    if (!mongoose) {
      console.error("GET /api/bots: Database connection failed");
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }
    
    console.log("GET /api/bots: Database connected successfully");

    // Check if we're looking for a specific bot address
    const url = new URL(request.url);
    const botAddress = url.searchParams.get('address');
    const updateStats = url.searchParams.get('updateStats') === 'true';

    console.log("GET /api/bots: Query params:", { botAddress, updateStats });

    // If updateStats is true, update all bot stats
    if (updateStats) {
      console.log("GET /api/bots: Updating all bot stats");
      try {
        const updatedCount = await updateExistingBotStats(mongoose);
        console.log(`GET /api/bots: Successfully updated ${updatedCount} bots`);
        return NextResponse.json({
          success: true,
          message: `Updated stats for ${updatedCount} bots`
        });
      } catch (updateError) {
        console.error("GET /api/bots: Error updating bot stats:", updateError);
        return NextResponse.json(
          {
            error: "Failed to update bot stats",
            details: updateError instanceof Error ? updateError.message : String(updateError)
          },
          { status: 500 }
        );
      }
    }

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
      {
        error: "Failed to generate bots",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
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