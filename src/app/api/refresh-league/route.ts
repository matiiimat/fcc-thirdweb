import { NextResponse } from "next/server";

export async function POST() {
  try {
    // This endpoint doesn't need to do anything specific
    // It's just used to trigger a refresh on the client side
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in refresh-league endpoint:", error);
    return NextResponse.json(
      { error: "Failed to refresh league data" },
      { status: 500 }
    );
  }
} 