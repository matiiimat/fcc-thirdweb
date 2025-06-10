import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { TRAINING_CONSTANTS } from '@/app/lib/constants';

interface TriggerRequestBody {
  ethAddress: string;
  type: 'training' | 'match';
}

export async function POST(req: NextRequest) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse and validate request body
    let body: TriggerRequestBody;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { ethAddress, type } = body;

    // Validate required fields
    if (!ethAddress || typeof ethAddress !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid ethAddress (must be a string)' },
        { status: 400 }
      );
    }

    if (!type || !['training', 'match'].includes(type)) {
      return NextResponse.json(
        { error: 'Missing or invalid type (must be "training" or "match")' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Find player by ethAddress
    const player = await Player.findOne({
      ethAddress: ethAddress.toLowerCase()
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Determine which trigger field to check and cooldown period
    const triggerField = type === 'training' ? 'lastTrainingNotificationTrigger' : 'lastMatchNotificationTrigger';
    const cooldownHours = type === 'training' ? 
      TRAINING_CONSTANTS.TRAINING_COOLDOWN_HOURS : 
      TRAINING_CONSTANTS.GAME_COOLDOWN_HOURS;

    // Check if cooldown has passed
    const lastTrigger = player[triggerField];
    const now = new Date();
    
    if (lastTrigger) {
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      const timeSinceLastTrigger = now.getTime() - lastTrigger.getTime();
      
      if (timeSinceLastTrigger < cooldownMs) {
        const remainingMs = cooldownMs - timeSinceLastTrigger;
        return NextResponse.json({
          success: false,
          remaining: remainingMs
        });
      }
    }

    // Update the trigger timestamp
    const updateData = {
      [triggerField]: now
    };

    await Player.findByIdAndUpdate(
      player._id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Trigger notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}