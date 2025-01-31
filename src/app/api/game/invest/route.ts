import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { ValidationError } from '@/app/lib/validation';

// Investment types and their characteristics
const INVESTMENT_TYPES = {
  SAFE: {
    name: 'Safe Investment',
    minAmount: 100,
    maxReturn: 1.15, // 15% max return
    minReturn: 1.05, // 5% min return
    riskFactor: 0.1, // 10% chance of loss
    maxLoss: 0.95, // 5% max loss
  },
  MODERATE: {
    name: 'Moderate Investment',
    minAmount: 500,
    maxReturn: 1.35, // 35% max return
    minReturn: 1.1, // 10% min return
    riskFactor: 0.3, // 30% chance of loss
    maxLoss: 0.8, // 20% max loss
  },
  RISKY: {
    name: 'Risky Investment',
    minAmount: 1000,
    maxReturn: 2.0, // 100% max return
    minReturn: 1.2, // 20% min return
    riskFactor: 0.6, // 60% chance of loss
    maxLoss: 0.5, // 50% max loss
  },
};

// Calculate investment return based on type and amount
function calculateInvestmentReturn(type: keyof typeof INVESTMENT_TYPES, amount: number): number {
  const investment = INVESTMENT_TYPES[type];
  const isLoss = Math.random() < investment.riskFactor;

  if (isLoss) {
    // Calculate loss
    const lossMultiplier = investment.maxLoss + (1 - investment.maxLoss) * Math.random();
    return Math.floor(amount * lossMultiplier);
  } else {
    // Calculate profit
    const returnMultiplier = 
      investment.minReturn + 
      (investment.maxReturn - investment.minReturn) * Math.random();
    return Math.floor(amount * returnMultiplier);
  }
}

// POST /api/game/invest - Make an investment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerId, investmentType, amount } = body;

    // Validate request
    if (!playerId || !investmentType || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate investment type
    if (!INVESTMENT_TYPES[investmentType as keyof typeof INVESTMENT_TYPES]) {
      return NextResponse.json(
        { error: 'Invalid investment type' },
        { status: 400 }
      );
    }

    const investment = INVESTMENT_TYPES[investmentType as keyof typeof INVESTMENT_TYPES];

    // Validate amount
    if (amount < investment.minAmount) {
      return NextResponse.json(
        { error: `Minimum investment amount is ${investment.minAmount}` },
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

    // Check if player has enough money
    if (player.money < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      );
    }

    // Calculate return
    const returnAmount = calculateInvestmentReturn(
      investmentType as keyof typeof INVESTMENT_TYPES,
      amount
    );

    // Update player's money and add investment record
    const updatedPlayer = await Player.findOneAndUpdate(
      { playerId },
      {
        $set: {
          money: player.money - amount + returnAmount,
        },
        $push: {
          investments: {
            type: investmentType,
            amount: amount,
            timestamp: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).select('-__v');

    const profit = returnAmount - amount;
    const isProfit = profit > 0;

    return NextResponse.json({
      success: true,
      investment: {
        type: investmentType,
        initialAmount: amount,
        returnAmount: returnAmount,
        profit: profit,
        isProfit: isProfit,
      },
      player: updatedPlayer,
      message: isProfit
        ? `Investment successful! Profit: ${profit}`
        : `Investment resulted in a loss of ${Math.abs(profit)}`,
    });
  } catch (error) {
    console.error('Investment error:', error);
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process investment' },
      { status: 500 }
    );
  }
}

// GET /api/game/invest - Get investment options
export async function GET() {
  return NextResponse.json({
    success: true,
    investmentTypes: INVESTMENT_TYPES,
  });
}