import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import NotificationModel from "@/app/models/Notification";
import Player from "@/app/models/Player";

// PUT /api/notifications/[id] - Update notification status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const ethAddress = req.headers.get("ethAddress")?.toLowerCase();
    if (!ethAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get the player to verify ownership
    const player = await Player.findOne({ ethAddress });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const body = await req.json();
    if (!["ACCEPTED", "DECLINED"].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be ACCEPTED or DECLINED" },
        { status: 400 }
      );
    }

    // Find and update the notification
    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: params.id,
        toPlayerId: player.playerId,
        status: "PENDING",
        expiresAt: { $gt: new Date() }
      },
      { status: body.status },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found or already processed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}