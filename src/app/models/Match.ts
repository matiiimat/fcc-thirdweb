import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITactic } from './Team';

export interface IMatchEvent {
  type: string;
  minute: number;
  description: string;
  playerAddress?: string;
  teamName: string;
}

export interface IPlayerRating {
  ethAddress: string;
  rating: number;
  goals: number;
  assists: number;
  saves?: number;
}

export interface IMatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
}

export interface IMatch extends Document {
  homeTeamId: Types.ObjectId;
  awayTeamId: Types.ObjectId;
  homeTeamName: string;
  awayTeamName: string;
  scheduledDate: Date;
  seasonId?: Types.ObjectId;
  matchday?: number;
  isCompleted: boolean;
  isInProgress?: boolean;
  homeTactic?: ITactic;
  awayTactic?: ITactic;
  result?: {
    homeScore: number;
    awayScore: number;
  };
  homeStats?: IMatchStats;
  awayStats?: IMatchStats;
  homePlayerRatings?: IPlayerRating[];
  awayPlayerRatings?: IPlayerRating[];
  events?: IMatchEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const MatchEventSchema = new Schema({
  type: String,
  minute: Number,
  description: String,
  playerAddress: String,
  teamName: String,
}, { _id: false });

const PlayerRatingSchema = new Schema({
  ethAddress: String,
  rating: Number,
  goals: Number,
  assists: Number,
  saves: Number,
}, { _id: false });

const MatchStatsSchema = new Schema({
  possession: Number,
  shots: Number,
  shotsOnTarget: Number,
  corners: Number,
  fouls: Number,
}, { _id: false });

const MatchSchema = new Schema<IMatch>({
  homeTeamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true,
  },
  awayTeamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true,
  },
  homeTeamName: {
    type: String,
    required: true,
  },
  awayTeamName: {
    type: String,
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
    index: true,
  },
  seasonId: {
    type: Schema.Types.ObjectId,
    ref: 'Season',
    index: true,
  },
  matchday: {
    type: Number,
  },
  isCompleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  isInProgress: {
    type: Boolean,
    default: false,
    index: true,
  },
  homeTactic: {
    type: Schema.Types.Mixed,
  },
  awayTactic: {
    type: Schema.Types.Mixed,
  },
  result: {
    homeScore: Number,
    awayScore: Number,
  },
  homeStats: MatchStatsSchema,
  awayStats: MatchStatsSchema,
  homePlayerRatings: [PlayerRatingSchema],
  awayPlayerRatings: [PlayerRatingSchema],
  events: [MatchEventSchema],
}, {
  timestamps: true,
});

// Indexes for common queries
MatchSchema.index({ scheduledDate: 1, isCompleted: 1 });
MatchSchema.index({ seasonId: 1, matchday: 1 });
MatchSchema.index({ homeTeamId: 1, scheduledDate: 1 });
MatchSchema.index({ awayTeamId: 1, scheduledDate: 1 });

const MatchModel = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export default MatchModel;