import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { calculateInvestments } from '@/app/lib/game';
import { authenticatePlayer } from '@/app/middleware/auth';
import { rateLimits } from '@/app/middleware/rateLimit';
import { validateSchema, investSchema } from '@/app/lib/schemas';
import { runTransaction } from '@/app/lib/transactions';

interface Investment {
  type: string;
  amount: number;
  timestamp: Date | string;
}

// POST /api/game/invest - Handle investment deposits and withdrawals
export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimits.invest();
    if (rateLimitResult.error) {
      return rateLimitResult.error;
    }

    // 2. Input validation
    const body = await req.json();
    const validationResult = validateSchema(investSchema, body);
    if (validationResult.error) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error },
        { status: 400 }
      );
    }

    const { playerId, type, action, amount } = validationResult.data;

    if (!['deposit', 'withdraw'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    await connectDB();

    // 3. Authentication
    const authResult = await authenticatePlayer(playerId);
    if (authResult.error) {
      return authResult.error;
    }

    const player = authResult.player;

    // Calculate current investment value including growth
    const currentInvestmentValue = calculateInvestments(player.investments);

    // 4. Run investment logic in transaction
    const result = await runTransaction(async (session) => {
      let updateData;
      if (action === 'deposit') {
        // Check if player has enough money
        if (player.money < amount) {
          return {
            error: NextResponse.json(
              { error: 'Insufficient funds' },
              { status: 400 }
            )
          };
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
          return {
            error: NextResponse.json(
              { error: 'Insufficient investment balance' },
              { status: 400 }
            )
          };
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

      // Update player within transaction
      const updatedPlayer = await Player.findOneAndUpdate(
        { playerId },
        updateData,
        { new: true, runValidators: true, session }
      ).select('-__v');

      if (!updatedPlayer) {
        throw new Error('Failed to update player');
      }

      return {
        data: {
          success: true,
          message: `Successfully ${action}ed ${amount}`,
          player: updatedPlayer,
        }
      };
    });

    if (result.error) {
      return result.error;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Investment error:', error);
    return NextResponse.json(
      { error: 'Failed to process investment' },
      { status: 500 }
    );
  }
}