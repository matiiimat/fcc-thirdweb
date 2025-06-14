import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Player from '@/app/models/Player';
import { TRAINING_CONSTANTS } from '@/app/lib/constants';

interface NotificationResult {
  playerId: string;
  playerName: string;
  type: 'training' | 'match';
  sent: boolean;
  error?: string;
}

interface CheckCooldownsResponse {
  success: boolean;
  processed: number;
  notifications: NotificationResult[];
  errors: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse<CheckCooldownsResponse>> {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        {
          success: false,
          processed: 0,
          notifications: [],
          errors: ['Unauthorized']
        },
        { status: 401 }
      );
    }

    await connectDB();

    const now = new Date();
    const notifications: NotificationResult[] = [];
    const errors: string[] = [];
    let processed = 0;

    const trainingCooldownMs = TRAINING_CONSTANTS.TRAINING_COOLDOWN_HOURS * 60 * 60 * 1000;
    const trainingCutoff = new Date(now.getTime() - trainingCooldownMs);

    const playersNeedingTrainingNotification = await Player.find({
      lastTrainingDate: {
        $exists: true,
        $ne: null,
        $lte: trainingCutoff
      },
      ethAddress: { $exists: true, $ne: null },
      $or: [
    { lastTrainingNotificationTrigger: { $exists: false } },
    { lastTrainingNotificationTrigger: null },
    { lastTrainingNotificationTrigger: { $lte: new Date(now.getTime() - trainingCooldownMs) } },
        {
          $expr: {
            $lt: ['$lastTrainingNotificationTrigger', '$lastTrainingDate']
          }
        }
      ]
    });

    console.log(`Found ${playersNeedingTrainingNotification.length} players needing training notifications`);

    for (const player of playersNeedingTrainingNotification) {
      processed++;

      try {
        const notificationSent = await sendTrainingNotification(player);

        notifications.push({
          playerId: player.playerId,
          playerName: player.playerName,
          type: 'training',
          sent: notificationSent
        });

      } catch (error) {
        const errorMsg = `Failed to send training notification to ${player.playerName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);

        notifications.push({
          playerId: player.playerId,
          playerName: player.playerName,
          type: 'training',
          sent: false,
          error: errorMsg
        });
      }
    }

    const matchCooldownMs = TRAINING_CONSTANTS.GAME_COOLDOWN_HOURS * 60 * 60 * 1000;
    const matchCutoff = new Date(now.getTime() - matchCooldownMs);

    const playersNeedingMatchNotification = await Player.find({
      lastGameDate: {
        $exists: true,
        $ne: null,
        $lte: matchCutoff
      },
      ethAddress: { $exists: true, $ne: null },
      $or: [
        { lastMatchNotificationTrigger: { $exists: false } },
        { lastMatchNotificationTrigger: null },
        {
          $expr: {
            $lt: ['$lastMatchNotificationTrigger', '$lastGameDate']
          }
        }
      ]
    });

    console.log(`Found ${playersNeedingMatchNotification.length} players needing match notifications`);

    for (const player of playersNeedingMatchNotification) {
      processed++;

      try {
        const notificationSent = await sendMatchNotification(player);

        notifications.push({
          playerId: player.playerId,
          playerName: player.playerName,
          type: 'match',
          sent: notificationSent
        });

      } catch (error) {
        const errorMsg = `Failed to send match notification to ${player.playerName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);

        notifications.push({
          playerId: player.playerId,
          playerName: player.playerName,
          type: 'match',
          sent: false,
          error: errorMsg
        });
      }
    }

    console.log(`Processed ${processed} players, sent ${notifications.filter(n => n.sent).length} notifications`);

    return NextResponse.json({
      success: true,
      processed,
      notifications,
      errors
    });

  } catch (error) {
    console.error('Check cooldowns error:', error);
    return NextResponse.json(
      {
        success: false,
        processed: 0,
        notifications: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      },
      { status: 500 }
    );
  }
}

async function sendTrainingNotification(player: any): Promise<boolean> {
  try {
    const webhookUrl = process.env.FARCASTER_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('FARCASTER_WEBHOOK_URL not configured');
      return false;
    }

    const notificationPayload = {
      notificationId: crypto.randomUUID(),
      title: '⚽ Training Available!',
      body: `${player.playerName}, your training cooldown is over! Time to improve your skills.`,
      targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/train`,
      ethAddress: player.ethAddress
    };

    console.log(`Sending training notification to ${player.playerName} (ethAddress: ${player.ethAddress})`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.FARCASTER_API_KEY && {
          'Authorization': `Bearer ${process.env.FARCASTER_API_KEY}`
        })
      },
      body: JSON.stringify(notificationPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send training notification: ${response.status} ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`Training notification sent successfully to ${player.playerName}:`, result);
    return true;

  } catch (error) {
    console.error('Error sending training notification:', error);
    return false;
  }
}

async function sendMatchNotification(player: any): Promise<boolean> {
  try {
    const webhookUrl = process.env.FARCASTER_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('FARCASTER_WEBHOOK_URL not configured');
      return false;
    }

    const notificationPayload = {
      notificationId: crypto.randomUUID(),
      title: '🏆 Match Ready!',
      body: `${player.playerName}, you can now play a solo match! Show your skills on the pitch.`,
      targetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/solomatch`,
      ethAddress: player.ethAddress
    };

    console.log(`Sending match notification to ${player.playerName} (ethAddress: ${player.ethAddress})`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.FARCASTER_API_KEY && {
          'Authorization': `Bearer ${process.env.FARCASTER_API_KEY}`
        })
      },
      body: JSON.stringify(notificationPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send match notification: ${response.status} ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`Match notification sent successfully to ${player.playerName}:`, result);
    return true;

  } catch (error) {
    console.error('Error sending match notification:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}