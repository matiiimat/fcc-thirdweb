import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';

export async function POST(req: NextRequest) {
  try {
    // Simple security check - you might want to add proper authentication
    const { secret } = await req.json();
    if (secret !== 'migrate-notifications-2024') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Test with specific address first
    const testAddress = '0x6be82ef4ad6534a66e8e7568956c523bb1b5e6e0';
    
    // Add the new fields to the test player only
    const result = await Player.updateOne(
      {
        ethAddress: testAddress,
        // Only update if the player doesn't have these fields yet
        $or: [
          { lastTrainingNotificationTrigger: { $exists: false } },
          { lastMatchNotificationTrigger: { $exists: false } }
        ]
      },
      {
        $set: {
          lastTrainingNotificationTrigger: null,
          lastMatchNotificationTrigger: null
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: `No player found with address ${testAddress} or fields already exist`,
        details: result
      });
    } else if (result.modifiedCount === 1) {
      // Verify the update
      const updatedPlayer = await Player.findOne({ ethAddress: testAddress });
      return NextResponse.json({
        success: true,
        message: `Successfully updated player ${testAddress} with notification trigger fields`,
        player: {
          ethAddress: updatedPlayer?.ethAddress,
          lastTrainingNotificationTrigger: updatedPlayer?.lastTrainingNotificationTrigger,
          lastMatchNotificationTrigger: updatedPlayer?.lastMatchNotificationTrigger
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Player ${testAddress} found but no changes made (fields may already exist)`,
        details: result
      });
    }

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Use POST method with secret' },
    { status: 405 }
  );
}