import mongoose, { Schema, Document, Types } from 'mongoose';
import { PLAYER_CONSTANTS, TEAM_CONSTANTS } from '../lib/constants';
import { Position } from './Player';

// Interface for player position in tactic
export interface IPlayerPosition {
  ethAddress: string;
  position: Position;
  x: number;
  y: number;
}

// Interface for tactic
export interface ITactic {
  _id?: string | Types.ObjectId;
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

// Interface for team statistics
export interface ITeamStats {
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  tacticsUsed: {
    name: string;
    gamesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  }[];
}

export interface ITeamMatchRecord {
  id: string;
  homeTeam: string;
  awayTeam: string;
  opponent?: string;
  isHome?: boolean;
  date: string;
  isCompleted: boolean;
  homeTactic: ITactic;
  awayTactic: ITactic;
  result: { homeScore: number; awayScore: number };
  events?: unknown;
  homeStats?: unknown;
  awayStats?: unknown;
  homePlayerRatings?: unknown;
  awayPlayerRatings?: unknown;
}

export interface ITeam extends Document {
  teamName: string;
  captainAddress: string;
  players: string[]; // Array of player ETH addresses, managed via the Manage Team page
  tactics: ITactic[];
  matches: ITeamMatchRecord[];
  jersey?: IJersey;
  stats: ITeamStats;
  isPublic: boolean; // Whether the team is visible in available teams section
  createdAt: Date;
  updatedAt: Date;
}

// Schema for team statistics
const TacticStatsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  gamesPlayed: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  },
  draws: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  goalsFor: {
    type: Number,
    default: 0,
  },
  goalsAgainst: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const TeamStatsSchema = new Schema({
  gamesPlayed: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  },
  draws: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  goalsFor: {
    type: Number,
    default: 0,
  },
  goalsAgainst: {
    type: Number,
    default: 0,
  },
  cleanSheets: {
    type: Number,
    default: 0,
  },
  tacticsUsed: [TacticStatsSchema],
}, { _id: false });

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
    enum: ['GK', 'D', 'M', 'F'],
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
      type: [mongoose.Schema.Types.Mixed] as any,
      default: [],
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
    },
    stats: {
      type: TeamStatsSchema,
      default: () => ({
        gamesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        cleanSheets: 0,
        tacticsUsed: [],
      }),
    },
    isPublic: {
      type: Boolean,
      default: true, // Teams are public by default
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure captain address is lowercase
TeamSchema.pre('save', function(this: ITeam & { captainAddress?: string, players?: string[] }, next) {
  if (this.captainAddress) {
    this.captainAddress = this.captainAddress.toLowerCase();
  }
  if (this.players) {
    this.players = this.players.map((player: string) => player.toLowerCase());
  }
  next();
});

// Pre-save middleware to validate team size
TeamSchema.pre('save', function(this: ITeam & { players?: string[] }, next) {
  if (this.players && this.players.length > TEAM_CONSTANTS.MAX_PLAYERS) {
    next(new Error(`Team cannot have more than ${TEAM_CONSTANTS.MAX_PLAYERS} players`));
    return;
  }
  next();
});

// Create the model
const TeamModel = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default TeamModel;