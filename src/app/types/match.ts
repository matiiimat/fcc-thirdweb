import { ITactic, ITeamStats } from "../models/Team";
import { Match as BaseMatch } from "../lib/match";

export interface PlayerStats {
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  tackles: number;
  saves?: number;
}

export interface PlayerRating {
  ethAddress: string;
  position: string;
  rating: number;
  stats: PlayerStats;
}

export interface MatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
}

export interface PlayerRating {
  ethAddress: string;
  rating: number;
  goals: number;
  assists: number;
  saves?: number;
}

export interface MatchEvent {
  type: string;
  minute: number;
  description: string;
  playerAddress?: string;
  teamName: string;
}

export interface Match extends BaseMatch {
  _id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  scheduledDate: string;
  seasonId?: string;
  matchday?: number;
  isCompleted: boolean;
  homeTactic?: ITactic;
  awayTactic?: ITactic;
  result?: {
    homeScore: number;
    awayScore: number;
  };
  homeStats?: MatchStats;
  awayStats?: MatchStats;
  homePlayerRatings?: PlayerRating[];
  awayPlayerRatings?: PlayerRating[];
  events?: MatchEvent[];
  stats?: {
    home: ITeamStats;
    away: ITeamStats;
  };
}