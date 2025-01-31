import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player, { IPlayer } from '@/app/models/Player';
import { randomUUID } from 'crypto';
import { generatePlayerName, applyNationalityBonus } from '@/app/lib/names';
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

    // Generate player name and nationality
    const { name: playerName, nationality } = generatePlayerName(ethAddress);
    console.log('Generated player name and nationality:', { playerName, nationality }); // Debug log

    // Create base stats (all starting at 1)
    const baseStats = {
      strength: 1,
      stamina: 1,
      passing: 1,
      shooting: 1,
      defending: 1,
      speed: 1,
      positioning: 1,
    };

    // Apply nationality bonus
    const stats = applyNationalityBonus(baseStats, nationality);
    console.log('Applied nationality bonus:', stats); // Debug log

    try {
      // Create new player
      const newPlayer = new Player({
        playerId: randomUUID(),
        playerName,
        ethAddress,
        team,
        money: 1000, // Default starting money
        investments: [],
        stats,
        lastTrainingDate: null,
      });

      console.log('Attempting to save new player:', JSON.stringify(newPlayer.toJSON())); // Debug log

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
    console.error('POST /api/players error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}