import { NextRequest, NextResponse } from 'next/server';
import PlayerModel from '@/app/models/Player';
import { headers } from 'next/headers';

export async function authenticatePlayer(playerId: string) {
  try {
    const headersList = headers();
    const walletAddress = headersList.get('x-wallet-address')?.toLowerCase();

    if (!walletAddress) {
      return {
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      };
    }

    const player = await PlayerModel.findOne({
      playerId,
      ethAddress: walletAddress // Changed from walletAddress to ethAddress to match model
    });

    if (!player) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 403 }
        )
      };
    }

    return { player };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    };
  }
}