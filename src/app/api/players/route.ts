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
    console.error('GET /api/players error:', error);
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

    console.log('Creating player with data:', { ethAddress, team }); // Debug log

    // Validate required fields
    if (!ethAddress || !team) {
      console.log('Missing required fields:', { ethAddress, team }); // Debug log
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    try {
      await connectDB();
      console.log('MongoDB connected successfully'); // Debug log
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    try {
      // Check if player with ethAddress already exists
      const existingPlayer = await Player.findOne({ ethAddress });
      if (existingPlayer) {
        console.log('Player already exists for address:', ethAddress); // Debug log
        return NextResponse.json(
          { error: 'Player with this ETH address already exists' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error checking existing player:', error);
      return NextResponse.json(
        { error: 'Failed to check existing player' },
        { status: 500 }
      );
    }

    // Generate player name based on ETH address
    try {
      const playerName = generatePlayerName(ethAddress);
      console.log('Generated player name:', playerName); // Debug log

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

      console.log('Attempting to save new player:', JSON.stringify(newPlayer.toJSON())); // Debug log

      try {
        await newPlayer.save();
        console.log('Player saved successfully'); // Debug log
        return NextResponse.json(newPlayer, { status: 201 });
      } catch (saveError) {
        console.error('Error saving player:', saveError);
        return NextResponse.json(
          { error: 'Failed to save player to database' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error creating player:', error);
      return NextResponse.json(
        { error: 'Failed to create player' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST /api/players error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}