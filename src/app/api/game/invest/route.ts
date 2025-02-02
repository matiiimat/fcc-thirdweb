import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { calculateInvestments } from '@/app/lib/game';

interface Investment {
  type: string;
  amount: number;
  timestamp: Date | string;
}

// POST /api/game/invest - Handle investment deposits and withdrawals
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

    if (!['deposit', 'withdraw'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
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

    // Calculate current investment value including growth
    const currentInvestmentValue = calculateInvestments(player.investments);

    try {
      let updateData;
      if (action === 'deposit') {
        // Check if player has enough money
        if (player.money < amount) {
          return NextResponse.json(
            { error: 'Insufficient funds' },
            { status: 400 }
          );
        }

        // Add investment and deduct from money
        updateData = {
          $push: { 
            investments: { 
              type: 'investment',
              amount,
              timestamp: new Date()
            }
          },
          $inc: { money: -amount },
        };
      } else {
        // Check if investment account has enough balance
        if (currentInvestmentValue < amount) {
          return NextResponse.json(
            { error: 'Insufficient investment balance' },
            { status: 400 }
          );
        }

        // Calculate the proportion of each investment to withdraw
        const withdrawalProportion = amount / currentInvestmentValue;
        const remainingInvestments = player.investments
          .filter((inv: Investment) => inv.type === 'investment')
          .map((inv: Investment) => {
            const investmentAge = Math.floor(
              (Date.now() - new Date(inv.timestamp).getTime()) / (1000 * 60 * 60 * 24)
            );
            const currentValue = inv.amount * Math.pow(1.01, investmentAge);
            const withdrawalAmount = currentValue * withdrawalProportion;
            const remainingAmount = currentValue - withdrawalAmount;
            return {
              type: 'investment',
              amount: remainingAmount,
              timestamp: new Date() // Reset timestamp for remaining amount
            };
          })
          .filter((inv: Investment) => inv.amount > 0);

        // Update investments and add to money
        updateData = {
          $set: { investments: remainingInvestments },
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
        message: `Successfully ${action}ed ${amount}`,
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