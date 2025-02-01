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
  workEthic: number;
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
  lastConnectionDate: Date | null;
  consecutiveConnections: number;
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
    default: 1,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid number',
    },
  },
  stamina: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 1,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid number',
    },
  },
  passing: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 1,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid number',
    },
  },
  shooting: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 1,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid number',
    },
  },
  defending: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 1,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid number',
    },
  },
  speed: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 1,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid number',
    },
  },
  positioning: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 1,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid number',
    },
  },
  workEthic: {
    type: Number,
    required: true,
    min: 0,
    max: 20,
    default: 1,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid number',
    },
  },
});

// Schema for investments
const InvestmentSchema = new Schema<IInvestment>({
  type: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid number',
    },
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
      trim: true,
      index: true,
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
      trim: true,
      lowercase: true, // Ensure addresses are stored in lowercase
      index: true,
      validate: {
        validator: function(v: string) {
          // Basic ETH address validation (starts with 0x and has correct length)
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: props => `${props.value} is not a valid ETH address!`
      }
    },
    team: {
      type: String,
      required: true,
      trim: true,
    },
    money: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: '{VALUE} is not a valid number',
      },
    },
    investments: [InvestmentSchema],
    stats: {
      type: PlayerStatsSchema,
      required: true,
    },
    lastTrainingDate: {
      type: Date,
      default: null,
    },
    lastConnectionDate: {
      type: Date,
      default: null,
    },
    consecutiveConnections: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: '{VALUE} is not a valid number',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure ETH address is lowercase
PlayerSchema.pre('save', function(next) {
  if (this.ethAddress) {
    this.ethAddress = this.ethAddress.toLowerCase();
  }
  next();
});

// Pre-save middleware to validate stats
PlayerSchema.pre('save', function(next) {
  const stats = this.stats;
  if (!stats) {
    next(new Error('Player stats are required'));
    return;
  }

  // Validate each stat is a finite number between 0 and 20
  const statNames = ['strength', 'stamina', 'passing', 'shooting', 'defending', 'speed', 'positioning', 'workEthic'];
  for (const stat of statNames) {
    const value = stats[stat as keyof IPlayerStats];
    if (!Number.isFinite(value) || value < 0 || value > 20) {
      next(new Error(`Invalid value for ${stat}: ${value}`));
      return;
    }
  }
  next();
});

// Create the model
const PlayerModel = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

export default PlayerModel;