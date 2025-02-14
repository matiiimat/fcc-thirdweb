import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import PlayerModel from "../../../models/Player";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await req.json();

    await connectDB();

    const player = await PlayerModel.findOneAndUpdate(
      { ethAddress: id },
      updates,
      { new: true }
    );

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}