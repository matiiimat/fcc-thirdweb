import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import MatchModel from "@/app/models/Match";
import connectDB from "../../../lib/mongodb";

// Validation schema for the request body
const saveMatchRequestSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homeTeamName: z.string(),
  awayTeamName: z.string(),
  homeTactic: z.any(),
  awayTactic: z.any(),
  result: z.object({
    homeScore: z.number(),
    awayScore: z.number(),
  }),
  homeStats: z.object({
    possession: z.number(),
    shots: z.number(),
    shotsOnTarget: z.number(),
    passes: z.number().default(0),
    passAccuracy: z.number().default(0),
    tackles: z.number().default(0),
    fouls: z.number(),
  }).passthrough(), // Allow additional properties like corners
  awayStats: z.object({
    possession: z.number(),
    shots: z.number(),
    shotsOnTarget: z.number(),
    passes: z.number().default(0),
    passAccuracy: z.number().default(0),
    tackles: z.number().default(0),
    fouls: z.number(),
  }).passthrough(), // Allow additional properties like corners
  homePlayerRatings: z.array(
    z.object({
      ethAddress: z.string(),
      username: z.string().optional(),
      position: z.enum(["GK", "D", "M", "F"]).optional(),
      rating: z.number(),
      stats: z.object({
        goals: z.number().default(0),
        assists: z.number().default(0),
        shots: z.number().default(0),
        passes: z.number().default(0),
        tackles: z.number().default(0),
        saves: z.number().optional(),
      }).optional().default({
        goals: 0,
        assists: 0,
        shots: 0,
        passes: 0,
        tackles: 0
      }),
    }).passthrough()
  ),
  awayPlayerRatings: z.array(
    z.object({
      ethAddress: z.string(),
      username: z.string().optional(),
      position: z.enum(["GK", "D", "M", "F"]).optional(),
      rating: z.number(),
      stats: z.object({
        goals: z.number().default(0),
        assists: z.number().default(0),
        shots: z.number().default(0),
        passes: z.number().default(0),
        tackles: z.number().default(0),
        saves: z.number().optional(),
      }).optional().default({
        goals: 0,
        assists: 0,
        shots: 0,
        passes: 0,
        tackles: 0
      }),
    }).passthrough()
  ),
  events: z.array(
    z.object({
      type: z.union([
        z.literal("goal"),
        z.literal("action"),
        z.literal("system"),
        z.literal("skill_check"),
        z.string() // Fallback for any other types
      ]),
      minute: z.number(),
      description: z.string(),
      playerAddress: z.string().optional(),
      teamName: z.string(),
    })
  ).optional().default([]),
  isInProgress: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await request.json();
    const validatedData = saveMatchRequestSchema.parse(body);

    // Create a new match document with proper defaults
    const matchData = {
      homeTeamId: new mongoose.Types.ObjectId(validatedData.homeTeamId),
      awayTeamId: new mongoose.Types.ObjectId(validatedData.awayTeamId),
      homeTeamName: validatedData.homeTeamName,
      awayTeamName: validatedData.awayTeamName,
      scheduledDate: new Date(),
      isCompleted: validatedData.isInProgress ? false : true,
      isInProgress: !!validatedData.isInProgress,
      homeTactic: validatedData.homeTactic,
      awayTactic: validatedData.awayTactic,
      result: validatedData.result,
      homeStats: validatedData.homeStats,
      awayStats: validatedData.awayStats,
      homePlayerRatings: validatedData.homePlayerRatings,
      awayPlayerRatings: validatedData.awayPlayerRatings,
      events: validatedData.events || [],
    };

    const match = new MatchModel(matchData);

    // Save the match
    const savedMatch = await match.save();

    return NextResponse.json({
      success: true,
      matchId: savedMatch._id,
      message: "Match saved successfully",
    });
  } catch (error) {
    // Enhanced error logging with more details
    console.error("Error saving match:", error);
    
    // Determine the specific error type and provide a more detailed message
    let errorMessage = "Failed to save match";
    let errorDetails = null;
    let statusCode = 500;
    
    if (error instanceof mongoose.Error.ValidationError) {
      // Mongoose validation error
      errorMessage = "Match validation failed";
      errorDetails = Object.values(error.errors).map(err => err.message).join(', ');
      statusCode = 400;
    } else if (error instanceof mongoose.Error.CastError) {
      // Invalid ID format
      errorMessage = "Invalid ID format";
      errorDetails = error.message;
      statusCode = 400;
    } else if (error instanceof z.ZodError) {
      // Zod validation error
      errorMessage = "Invalid request data";
      errorDetails = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      statusCode = 400;
    } else if (error instanceof Error) {
      // Generic Error with message
      errorMessage = error.message;
      errorDetails = error.stack;
    }
    
    // Return a detailed error response
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        endpoint: "/api/matches/save"
      },
      { status: statusCode }
    );
  }
}