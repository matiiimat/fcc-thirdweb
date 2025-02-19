import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player, { IPlayer } from '@/app/models/Player';

interface Params {
  params: {
    address: string;
  };
}

// GET /api/players/address/[address] - Get player by ETH address
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const searchAddress = decodeURIComponent(params.address).toLowerCase();
    console.log('Looking up player by address:', searchAddress); // Debug log

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
      // List all players to debug address matching
      const allPlayers = await Player.find({}).select('ethAddress playerName');
      console.log('All players in DB:', allPlayers.map(p => ({
        name: p.playerName,
        address: p.ethAddress,
        addressLower: p.ethAddress.toLowerCase(),
        matches: p.ethAddress.toLowerCase() === searchAddress
      }))); // Debug log

      // Find the player
      const player = await Player.findOne({
        ethAddress: { $regex: new RegExp(`^${searchAddress}$`, 'i') }
      });
      
      if (player) {
        // Just update the last connection date
        player.lastConnectionDate = new Date();
        await player.save();
      }

      if (!player) {
        console.log('No player found for address:', searchAddress); // Debug log
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }

      console.log('Found player:', {
        id: player._id,
        name: player.playerName,
        address: player.ethAddress,
        searchedAddress: searchAddress,
        matches: player.ethAddress.toLowerCase() === searchAddress
      }); // Debug log
      
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