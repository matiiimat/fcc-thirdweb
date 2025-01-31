import mongoose, { Schema, Document } from 'mongoose';

// Interface for player stats
export interface IPlayerStats {
  strength: number;
  stamina: number;
  passing: number;
  shooting: number;
  defending: number;
  speed: number;
  positioning: number;
}

// Interface for investments
export interface IInvestment {
  type: string;
  amount: number;
  timestamp: Date;
}

// Interface for the player document
export interface IPlayer extends Document {
  playerId: string;
  playerName: string;
  ethAddress: string;
  team: string;
  money: number;
  investments: IInvestment[];
  stats: IPlayerStats;
  lastTrainingDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for player stats
const PlayerStatsSchema = new Schema<IPlayerStats>({
  strength: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 5,
  },
  stamina: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 5,
  },
  passing: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 5,
  },
  shooting: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 5,
  },
  defending: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 5,
  },
  speed: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 5,
  },
  positioning: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 5,
  },
});

// Schema for investments
const InvestmentSchema = new Schema<IInvestment>({
  type: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Main player schema
const PlayerSchema = new Schema<IPlayer>(
  {
    playerId: {
      type: String,
      required: true,
      unique: true,
    },
    playerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    ethAddress: {
      type: String,
      required: true,
      unique: true,
    },
    team: {
      type: String,
      required: true,
    },
    money: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
    },
    investments: [InvestmentSchema],
    stats: PlayerStatsSchema,
    lastTrainingDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PlayerSchema.index({ playerId: 1 });
PlayerSchema.index({ ethAddress: 1 });
PlayerSchema.index({ team: 1 });

// Create the model
export default mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);