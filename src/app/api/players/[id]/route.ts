import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/players/[id] - Get a single player
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const player = await Player.findOne({ playerId: params.id }).select('-__v');

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

// PUT /api/players/[id] - Update a player
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    await connectDB();

    // Find player and update
    const updatedPlayer = await Player.findOneAndUpdate(
      { playerId: params.id },
      { $set: body },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

// DELETE /api/players/[id] - Delete a player
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const deletedPlayer = await Player.findOneAndDelete({ playerId: params.id });

    if (!deletedPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Player deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}