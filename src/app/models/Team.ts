import mongoose, { Schema, Document } from 'mongoose';
import { PLAYER_CONSTANTS } from '../lib/constants';

// Interface for team document
export interface ITeam extends Document {
  teamName: string;
  captainAddress: string;
  players: string[]; // Array of player ETH addresses
  createdAt: Date;
  updatedAt: Date;
}

// Main team schema
const TeamSchema = new Schema<ITeam>(
  {
    teamName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: PLAYER_CONSTANTS.MIN_NAME_LENGTH,
      maxlength: PLAYER_CONSTANTS.MAX_NAME_LENGTH,
      index: true,
    },
    captainAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    players: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure captain address is lowercase
TeamSchema.pre('save', function(next) {
  if (this.captainAddress) {
    this.captainAddress = this.captainAddress.toLowerCase();
  }
  if (this.players) {
    this.players = this.players.map(player => player.toLowerCase());
  }
  next();
});

// Create the model
const TeamModel = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default TeamModel;