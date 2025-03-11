import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player, { IPlayer } from '@/app/models/Player';
import { randomUUID } from 'crypto';
import { generatePlayerName, applyNationalityBonus } from '@/app/lib/names';
import { validatePlayerData } from '@/app/lib/validation';
import mongoose from 'mongoose';

// GET /api/players - Get all players
export async function GET() {
  try {
    await connectDB();
    // Exclude players whose ethAddress starts with '0xbot' (bots)
    const players = await Player.find({
      ethAddress: { $not: /^0xbot/ }
    }).select('-__v');
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
    const { ethAddress, team, username } = body;

    console.log('Creating player with data:', { ethAddress, team, username }); // Debug log

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

    // Normalize the ETH address
    const normalizedAddress = ethAddress.toString().toLowerCase();

    try {
      // Check if player with ethAddress already exists
      console.log('Checking for existing player with address:', normalizedAddress); // Debug log
      
      const existingPlayer = await Player.findOne({ ethAddress: normalizedAddress });
      if (existingPlayer) {
        console.log('Player already exists for address:', normalizedAddress); // Debug log
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

    try {
      // Generate player name and nationality
      const { name: playerName, nationality } = generatePlayerName(normalizedAddress);
      console.log('Generated player details:', { playerName, nationality }); // Debug log

      if (!playerName) {
        console.error('Failed to generate player name');
        return NextResponse.json(
          { error: 'Failed to generate player name' },
          { status: 500 }
        );
      }

      // Create base stats (all starting at 1)
      const baseStats = {
        strength: 1,
        stamina: 1,
        passing: 1,
        shooting: 1,
        defending: 1,
        speed: 1,
        positioning: 1,
        workEthic: 1,
      };

      // Apply nationality bonus
      const stats = applyNationalityBonus(baseStats, nationality);
      console.log('Applied nationality bonus:', stats); // Debug log

      // Create new player
      const playerData = {
        playerId: randomUUID(),
        playerName: playerName, // Explicitly set playerName
        username: username || "", // Set username from Farcaster context
        ethAddress: normalizedAddress,
        team,
        money: 1000, // Default starting money
        investments: [],
        stats,
        lastTrainingDate: null,
        lastConnectionDate: new Date(),
        consecutiveConnections: 1,
      };

      console.log('Creating player with data:', playerData); // Debug log

      const newPlayer = new Player(playerData);

      try {
        await newPlayer.save();
        console.log('Player saved successfully:', newPlayer.toJSON()); // Debug log
        return NextResponse.json(newPlayer, { status: 201 });
      } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
          console.error('Validation error:', {
            errors: error.errors,
            message: error.message,
          });
          return NextResponse.json(
            { error: 'Invalid player data', details: error.message },
            { status: 400 }
          );
        }
        console.error('Error saving player:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
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