import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player, { IPlayer } from '@/app/models/Player';
import { randomUUID } from 'crypto';
import { generatePlayerName } from '@/app/lib/names';
import { validatePlayerData } from '@/app/lib/validation';

// GET /api/players - Get all players
export async function GET() {
  try {
    await connectDB();
    const players = await Player.find({}).select('-__v');
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

// POST /api/players - Create a new player
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ethAddress, team } = body;

    // Validate required fields
    if (!ethAddress || !team) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if player with ethAddress already exists
    const existingPlayer = await Player.findOne({ ethAddress });
    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player with this ETH address already exists' },
        { status: 400 }
      );
    }

    // Generate player name based on ETH address
    const playerName = generatePlayerName(ethAddress);

    // Create new player with default stats
    const newPlayer = new Player({
      playerId: randomUUID(),
      playerName,
      ethAddress,
      team,
      money: 1000, // Default starting money
      investments: [],
      stats: {
        strength: 5,
        stamina: 5,
        passing: 5,
        shooting: 5,
        defending: 5,
        speed: 5,
        positioning: 5,
      },
      lastTrainingDate: null,
    });

    await newPlayer.save();
    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    console.error('Create player error:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}