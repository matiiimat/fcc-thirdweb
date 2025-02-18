import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Team from "@/app/models/Team";

export async function GET() {
  try {
    await connectDB();

    // Get top 50 teams sorted by victories
    const teams = await Team.aggregate([
      {
        $addFields: {
          matches: {
            $ifNull: ["$matches", []]
          }
        }
      },
      {
        $project: {
          teamName: 1,
          victories: {
            $size: {
              $filter: {
                input: "$matches",
                as: "match",
                cond: {
                  $and: [
                    { "$eq": ["$$match.isCompleted", true] },
                    {
                      $or: [
                        {
                          $and: [
                            { "$eq": ["$$match.homeTeam", "$teamName"] },
                            { "$gt": ["$$match.result.homeScore", "$$match.result.awayScore"] }
                          ]
                        },
                        {
                          $and: [
                            { "$eq": ["$$match.awayTeam", "$teamName"] },
                            { "$gt": ["$$match.result.awayScore", "$$match.result.homeScore"] }
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      },
      { $sort: { victories: -1 } },
      { $limit: 50 }
    ]);

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch team leaderboard" },
      { status: 500 }
    );
  }
}