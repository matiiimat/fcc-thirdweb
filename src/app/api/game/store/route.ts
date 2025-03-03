import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import PlayerModel from "@/app/models/Player";
import { authenticatePlayer } from "@/app/middleware/auth";
import { rateLimits } from "@/app/middleware/rateLimit";
import { validateSchema, storeSchema } from "@/app/lib/schemas";
import { runTransaction } from "@/app/lib/transactions";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimits.store();
    if (rateLimitResult.error) {
      return rateLimitResult.error;
    }

    // 2. Input validation
    const body = await req.json();
    const validationResult = validateSchema(storeSchema, body);
    if (validationResult.error) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error },
        { status: 400 }
      );
    }

    const { playerId, item, selectedSkill, newName } = validationResult.data;

    await connectDB();

    // 3. Authentication
    const authResult = await authenticatePlayer(playerId);
    if (authResult.error) {
      return authResult.error;
    }

    const player = authResult.player;

    // 4. Run purchase logic in transaction
    const result = await runTransaction(async (session) => {
      let updateData: any = {};

      // Add any specific effects based on the item
      switch (item.id) {
        case "name_change":
          if (!newName) {
            return {
              error: NextResponse.json(
                { error: "New name is required for name change" },
                { status: 400 }
              )
            };
          }
          updateData.$set = {
            playerName: newName
          };
          break;
        case "private_trainer":
          if (!selectedSkill) {
            return {
              error: NextResponse.json(
                { error: "Skill selection is required for private trainer" },
                { status: 400 }
              )
            };
          }
          // Set private trainer details
          updateData.$set = {
            'privateTrainer.selectedSkill': selectedSkill,
            'privateTrainer.remainingSessions': 5,
            lastTrainingDate: null // Allow immediate training
          };
          break;
        case "management_certificate":
          updateData.$set = {
            managementCertificate: true
          };
          break;
        case "leave_of_absence":
          // Calculate expiration date (5 days from now)
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 5);
          
          // If player already has leave of absence, add 5 more days
          if (player.leaveOfAbsence && player.leaveOfAbsence.expirationDate) {
            const currentExpiration = new Date(player.leaveOfAbsence.expirationDate);
            if (currentExpiration > new Date()) {
              expirationDate.setDate(currentExpiration.getDate() + 5);
            }
          }
          
          updateData.$set = {
            'leaveOfAbsence.expirationDate': expirationDate,
            'leaveOfAbsence.daysRemaining': player.leaveOfAbsence && player.leaveOfAbsence.daysRemaining
              ? player.leaveOfAbsence.daysRemaining + 5
              : 5
          };
          break;
        case "energy_drink":
          const now = new Date();
          
          // Check if we need to reset the purchase count (if it's been more than 24 hours or no previous purchases)
          if (!player.energyDrinkPurchases?.resetTime ||
              (now.getTime() - new Date(player.energyDrinkPurchases.resetTime).getTime()) >= 24 * 60 * 60 * 1000) {
            updateData.$set = {
              lastTrainingDate: null,
              'energyDrinkPurchases.count': 1,
              'energyDrinkPurchases.resetTime': now
            };
          } else {
            // Increment the purchase count within the 24-hour window
            updateData.$set = {
              lastTrainingDate: null,
              'energyDrinkPurchases.count': (player.energyDrinkPurchases.count || 0) + 1
            };
          }
          break;
        default:
          return {
            error: NextResponse.json(
              { error: "Invalid item" },
              { status: 400 }
            )
          };
      }

      // Update player within transaction
      const updatedPlayer = await PlayerModel.findOneAndUpdate(
        { playerId },
        updateData,
        { new: true, runValidators: true, session }
      ).select('-__v');

      if (!updatedPlayer) {
        throw new Error('Failed to update player');
      }

      return {
        data: {
          success: true,
          newName: updatedPlayer.playerName,
          privateTrainer: updatedPlayer.privateTrainer,
          leaveOfAbsence: updatedPlayer.leaveOfAbsence,
          managementCertificate: updatedPlayer.managementCertificate
        }
      };
    });

    if (result.error) {
      return result.error;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Store purchase error:", error);
    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}