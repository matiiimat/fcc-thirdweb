import mongoose, { Schema, Document } from 'mongoose';
import { PLAYER_CONSTANTS, TEAM_CONSTANTS } from '../lib/constants';
import { Position } from './Player';

// Interface for match
export interface IMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  isCompleted: boolean;
  homeTactic?: ITactic;
  awayTactic?: ITactic;
  result?: {
    homeScore: number;
    awayScore: number;
  };
}

// Interface for player position in tactic
export interface IPlayerPosition {
  ethAddress: string;
  position: Position;
  x: number;
  y: number;
}

// Interface for tactic
export interface ITactic {
  name: string;
  formation: string;
  tacticalStyle: 'None' | 'Tiki-Taka' | 'Gegenpressing' | 'Kick & Rush' | 'Counter Attacking' | 'Catennacio';
  playerPositions: IPlayerPosition[];
}

// Interface for team document
export interface IJersey {
  primaryColor: string;
  secondaryColor: string;
  pattern: 'solid' | 'stripes' | 'halves' | 'quarters';
  sponsorLogoUrl?: string; // URL to sponsor logo
}

export interface ITeam extends Document {
  teamName: string;
  captainAddress: string;
  players: string[]; // Array of player ETH addresses
  tactics: ITactic[];
  matches: IMatch[];
  jersey?: IJersey;
  createdAt: Date;
  updatedAt: Date;
}

// Main team schema
// Schema for player position in tactic
const PlayerPositionSchema = new Schema({
  ethAddress: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  position: {
    type: String,
    required: true,
    enum: ['D', 'M', 'F'],
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
});

// Schema for tactic
const TacticSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  formation: {
    type: String,
    required: true,
    enum: ['5-4-1', '5-3-2', '4-4-2', '4-3-3', '4-5-1', '3-4-3'],
  },
  tacticalStyle: {
    type: String,
    required: true,
    enum: ['None', 'Tiki-Taka', 'Gegenpressing', 'Kick & Rush', 'Counter Attacking', 'Catennacio'],
  },
  playerPositions: [PlayerPositionSchema],
});

// Schema for match result
const MatchResultSchema = new Schema({
  homeScore: Number,
  awayScore: Number
}, { _id: false });

// Schema for match
const MatchSchema = new Schema({
  id: String,
  homeTeam: String,
  awayTeam: String,
  date: String,
  isCompleted: Boolean,
  homeTactic: TacticSchema,
  awayTactic: TacticSchema,
  result: MatchResultSchema
}, { _id: false });

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
    tactics: {
      type: [TacticSchema],
      default: [],
      validate: {
        validator: function(tactics: any[]) {
          return tactics.length <= 3;
        },
        message: 'Team cannot have more than 3 tactics',
      },
    },
    matches: {
      type: [{
        id: String,
        homeTeam: String,
        awayTeam: String,
        date: String,
        isCompleted: Boolean,
        homeTactic: TacticSchema,
        awayTactic: TacticSchema,
        result: {
          homeScore: Number,
          awayScore: Number
        }
      }],
      default: []
    },
    jersey: {
      type: {
        primaryColor: {
          type: String,
          default: '#ffffff'
        },
        secondaryColor: {
          type: String,
          default: '#000000'
        },
        pattern: {
          type: String,
          enum: ['solid', 'stripes', 'halves', 'quarters'],
          default: 'solid'
        },
        sponsorLogoUrl: {
          type: String,
          required: false,
          default: ''
        }
      },
      required: false
    }
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

// Pre-save middleware to validate team size
TeamSchema.pre('save', function(next) {
  if (this.players && this.players.length > TEAM_CONSTANTS.MAX_PLAYERS) {
    next(new Error(`Team cannot have more than ${TEAM_CONSTANTS.MAX_PLAYERS} players`));
    return;
  }
  next();
});

// Create the model
const TeamModel = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default TeamModel;