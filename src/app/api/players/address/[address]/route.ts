import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';

interface Params {
  params: {
    address: string;
  };
}

// GET /api/players/address/[address] - Get player by ETH address
export async function GET(req: NextRequest, { params }: Params) {
  try {
    console.log('Looking up player by address:', params.address); // Debug log

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
      const player = await Player.findOne({ 
        ethAddress: params.address 
      }).select('-__v');

      if (!player) {
        console.log('No player found for address:', params.address); // Debug log
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }

      console.log('Found player:', JSON.stringify(player.toJSON())); // Debug log
      return NextResponse.json(player);
    } catch (error) {
      console.error('Error finding player:', error);
      return NextResponse.json(
        { error: 'Failed to fetch player' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('GET /api/players/address/[address] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}