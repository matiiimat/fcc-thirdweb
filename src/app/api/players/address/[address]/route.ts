import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player, { IPlayer } from '@/app/models/Player';
import Team from '@/app/models/Team';
import cache, { CACHE_KEYS, setInCache } from '@/app/lib/serverCache';

interface Params {
  params: {
    address: string;
  };
}

// GET /api/players/address/[address] - Get player by ETH address
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const searchAddress = decodeURIComponent(params.address).toLowerCase();
    console.log('Looking up player by address:', searchAddress);

    // Check cache first
    const cacheKey = CACHE_KEYS.PLAYER_BY_ADDRESS(searchAddress);
    const cachedPlayer = cache.get(cacheKey);
    
    if (cachedPlayer) {
      console.log('Player found in cache:', searchAddress);
      return NextResponse.json(cachedPlayer);
    }

    try {
      await connectDB();
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    try {
      // Find the player - use direct lookup instead of regex for better performance
      const player = await Player.findOne({
        ethAddress: searchAddress
      });
      
      if (!player) {
        console.log('No player found for address:', searchAddress);
        return NextResponse.json(
          { error: 'Player not found' },
          { status: 404 }
        );
      }

      // Update the last connection date
      player.lastConnectionDate = new Date();
      await player.save();

      // Cache the player data (30 seconds TTL for more responsive updates)
      const playerData = player.toObject();
      setInCache(cacheKey, playerData, 30);
      
      console.log('Found player:', {
        id: player._id,
        name: player.playerName,
        address: player.ethAddress
      });
      
      return NextResponse.json(playerData);
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

// DELETE /api/players/address/[address] - Delete player by ETH address
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const searchAddress = decodeURIComponent(params.address).toLowerCase();
    console.log('Attempting to delete player with address:', searchAddress);

    await connectDB();

    // Find the player first - use direct lookup instead of regex
    const player = await Player.findOne({
      ethAddress: searchAddress
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // If player is in a team, remove them from the team
    if (player.team && player.team !== 'Unassigned') {
      await Team.updateOne(
        { teamName: player.team },
        { $pull: { players: player.ethAddress } }
      );
      
      // Invalidate team cache
      const team = await Team.findOne({ teamName: player.team });
      if (team) {
        cache.del(CACHE_KEYS.TEAM(team._id.toString()));
        cache.del(CACHE_KEYS.TEAM_BY_NAME(player.team));
      }
    }

    // Delete the player
    await Player.deleteOne({ _id: player._id });
    
    // Invalidate player cache
    cache.del(CACHE_KEYS.PLAYER(player._id.toString()));
    cache.del(CACHE_KEYS.PLAYER_BY_ADDRESS(searchAddress));
    
    // Invalidate leaderboard cache as it might contain this player
    cache.del(CACHE_KEYS.LEADERBOARD);

    return NextResponse.json({
      message: 'Player deleted successfully',
      deletedPlayerId: player._id
    });
  } catch (error) {
    console.error('DELETE /api/players/address/[address] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}