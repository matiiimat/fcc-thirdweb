import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import TeamModel from "../../../models/Team";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Delete the MatchSchedule document
    await TeamModel.deleteOne({ teamName: "MatchSchedule" });
    
    return NextResponse.json({ message: "Match schedule reset successfully" });
  } catch (error) {
    console.error("Error resetting match schedule:", error);
    return NextResponse.json(
      { error: "Failed to reset match schedule" },
      { status: 500 }
    );
  }
}