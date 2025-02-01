import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';

interface Investment {
  type: string;
  amount: number;
  timestamp: Date;
}

// POST /api/game/invest - Handle investments and withdrawals
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, type, action, amount } = body;

    if (!playerId || !type || !action || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['savings', 'investment'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid investment type' },
        { status: 400 }
      );
    }

    if (!['add', 'withdraw'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
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

    // Check if player has enough money for investment
    if (action === 'add' && player.money < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      );
    }

    // Check if account has enough balance for withdrawal
    if (action === 'withdraw') {
      const accountBalance = player.investments
        .filter((inv: Investment) => inv.type === type)
        .reduce((sum: number, inv: Investment) => sum + inv.amount, 0);

      if (accountBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient balance in account' },
          { status: 400 }
        );
      }
    }

    try {
      let updateData;
      if (action === 'add') {
        // Add investment and deduct from money
        updateData = {
          $push: { investments: { type, amount, timestamp: new Date() } },
          $inc: { money: -amount },
        };
      } else {
        // Add negative investment (withdrawal) and add to money
        updateData = {
          $push: { investments: { type, amount: -amount, timestamp: new Date() } },
          $inc: { money: amount },
        };
      }

      // Update player
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        updateData,
        { new: true, runValidators: true }
      ).select('-__v');

      if (!updatedPlayer) {
        throw new Error('Failed to update player');
      }

      return NextResponse.json({
        success: true,
        message: `Successfully ${action}ed ${amount} to ${type} account`,
        player: updatedPlayer,
      });
    } catch (error) {
      console.error('Investment update error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Investment error:', error);
    return NextResponse.json(
      { error: 'Failed to process investment' },
      { status: 500 }
    );
  }
}