import { NextRequest, NextResponse } from "next/server";
import { getBotName } from "@/app/lib/botNames";
import { PLAYER_CONSTANTS } from "@/app/lib/constants";

const generateRandomStat = () => {
  return Math.floor(Math.random() * 4) + 3; // Random number between 3 and 6
};

const generateBot = (index: number) => {
  const botName = getBotName(index);
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
    ethAddress: `0xbot${index.toString().padStart(40, "0")}`,
    team: PLAYER_CONSTANTS.DEFAULT_TEAM,
    stats,
    isBot: true,
  };
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get("count") || "100");
    
    const bots = Array.from({ length: count }, (_, i) => generateBot(i));

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
    
    const bots = Array.from({ length: count }, (_, i) => generateBot(i));

    return NextResponse.json({ bots });
  } catch (error) {
    console.error("Error in POST /api/bots:", error);
    return NextResponse.json(
      { error: "Failed to generate bots" },
      { status: 500 }
    );
  }
}