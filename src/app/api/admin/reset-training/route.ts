import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';

// POST /api/admin/reset-training - Reset all players' training timers
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Reset all players' training timers
    const result = await Player.updateMany(
      {},
      { $set: { lastTrainingDate: null } }
    );

    console.log('Reset training timers:', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Training timers reset successfully',
      playersUpdated: result.modifiedCount,
    });
  } catch (error) {
    console.error('Reset training error:', error);
    return NextResponse.json(
      { error: 'Failed to reset training timers' },
      { status: 500 }
    );
  }
}