import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import { validateSchema, notificationSchema } from '@/app/lib/schemas';
import NotificationModel from '@/app/models/Notification';
import Player from '@/app/models/Player';

// GET /api/notifications - Get notifications for the current player
export async function GET(req: NextRequest) {
  try {
    const ethAddress = req.headers.get('ethAddress')?.toLowerCase();
    if (!ethAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get player ID from eth address
    const player = await Player.findOne({ ethAddress });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const notifications = await NotificationModel.find({
      toPlayerId: player.playerId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(req: NextRequest) {
  try {
    const ethAddress = req.headers.get('ethAddress')?.toLowerCase();
    if (!ethAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { data, error } = validateSchema(notificationSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    console.log('Creating notification with data:', data);

    // Verify the captain exists
    const captain = await Player.findOne({ ethAddress });
    if (!captain) {
      console.log('Captain not found:', ethAddress);
      return NextResponse.json({ error: 'Captain not found' }, { status: 404 });
    }

    // Verify the target player exists
    const targetPlayer = await Player.findOne({ playerId: data.toPlayerId });
    if (!targetPlayer) {
      console.log('Target player not found:', data.toPlayerId);
      return NextResponse.json({ error: 'Target player not found' }, { status: 404 });
    }

    // Check if there's already a pending invitation
    const existingNotification = await NotificationModel.findOne({
      fromTeamId: data.fromTeamId,
      toPlayerId: data.toPlayerId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() }
    });

    if (existingNotification) {
      console.log('Existing pending invitation found');
      return NextResponse.json(
        { error: 'Player already has a pending invitation from this team' },
        { status: 400 }
      );
    }

    const notification = await NotificationModel.create({
      ...data,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });

    console.log('Created notification:', notification);
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/:id - Update notification status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ethAddress = req.headers.get('ethAddress')?.toLowerCase();
    if (!ethAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Verify the player exists
    const player = await Player.findOne({ ethAddress });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const body = await req.json();
    if (!['ACCEPTED', 'DECLINED'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACCEPTED or DECLINED' },
        { status: 400 }
      );
    }

    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: params.id,
        toPlayerId: player.playerId,
        status: 'PENDING',
        expiresAt: { $gt: new Date() }
      },
      { status: body.status },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found or already processed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}