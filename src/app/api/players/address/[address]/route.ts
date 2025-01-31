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
    await connectDB();
    const player = await Player.findOne({ ethAddress: params.address }).select('-__v');

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}