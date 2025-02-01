import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';

// POST /api/game/invest/tax - Handle tax payments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, amount } = body;

    if (!playerId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get player
    const player = await Player.findOne({ playerId });
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if player has enough money for tax payment
    if (player.money < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      );
    }

    try {
      // Update player's money (deduct tax payment)
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        {
          $inc: { money: -amount },
          $push: {
            investments: {
              type: 'tax',
              amount: -amount,
              timestamp: new Date(),
            },
          },
        },
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedPlayer) {
        throw new Error('Failed to update player');
      }

      return NextResponse.json({
        success: true,
        message: `Successfully paid ${amount} in taxes`,
        player: updatedPlayer,
      });
    } catch (error) {
      console.error('Tax payment update error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Tax payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process tax payment' },
      { status: 500 }
    );
  }
}