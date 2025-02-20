import { Types } from "mongoose";
import TeamModel, { ITactic } from "../models/Team";
import PlayerModel, { IPlayer, Position } from "../models/Player";
import { simulateMatch } from "./matchEngine";
import { updateTeamStats } from "./teamStats";

interface QueuedMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTacticId: string;
  awayTacticId: string;
  scheduledDate: Date;
}

interface PlayerWithStats {
  ethAddress: string;
  position: Position;
  stats: IPlayer["stats"];
}

class MatchQueue {
  private static instance: MatchQueue;
  private queue: QueuedMatch[] = [];
  private isProcessing: boolean = false;

  private constructor() {}

  public static getInstance(): MatchQueue {
    if (!MatchQueue.instance) {
      MatchQueue.instance = new MatchQueue();
    }
    return MatchQueue.instance;
  }

  public async addMatch(match: QueuedMatch): Promise<void> {
    this.queue.push(match);
    this.queue.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  public async addMatches(matches: QueuedMatch[]): Promise<void> {
    this.queue.push(...matches);
    this.queue.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const now = new Date();

    try {
      // Process all matches that are due
      while (this.queue.length > 0 && this.queue[0].scheduledDate <= now) {
        const match = this.queue.shift();
        if (match) {
          await this.simulateMatch(match);
        }
      }
    } finally {
      this.isProcessing = false;
    }

    // If there are remaining matches, schedule the next check
    if (this.queue.length > 0) {
      const nextMatch = this.queue[0];
      const delay = nextMatch.scheduledDate.getTime() - now.getTime();
      setTimeout(() => this.processQueue(), delay);
    }
  }

  private async simulateMatch(match: QueuedMatch): Promise<void> {
    try {
      // Fetch teams with their players
      const [homeTeam, awayTeam] = await Promise.all([
        TeamModel.findById(match.homeTeamId),
        TeamModel.findById(match.awayTeamId),
      ]);

      if (!homeTeam || !awayTeam) {
        console.error(`Teams not found for match ${match.id}`);
        return;
      }

      // Find tactics
      const homeTactic = homeTeam.tactics.find(
        (t: ITactic & { _id: Types.ObjectId }) => t._id.toString() === match.homeTacticId
      );
      const awayTactic = awayTeam.tactics.find(
        (t: ITactic & { _id: Types.ObjectId }) => t._id.toString() === match.awayTacticId
      );

      if (!homeTactic || !awayTactic) {
        console.error(`Tactics not found for match ${match.id}`);
        return;
      }

      // Fetch all players for both teams
      const [homePlayers, awayPlayers] = await Promise.all([
        PlayerModel.find({ ethAddress: { $in: homeTeam.players } }),
        PlayerModel.find({ ethAddress: { $in: awayTeam.players } }),
      ]);

      // Map players to their positions from tactics
      const mapPlayersWithPositions = (
        players: IPlayer[],
        tactic: ITactic
      ): PlayerWithStats[] => {
        return tactic.playerPositions
          .map((pos) => {
            const player = players.find(
              (p) => p.ethAddress === pos.ethAddress
            );
            if (!player) return null;

            return {
              ethAddress: player.ethAddress,
              position: pos.position,
              stats: player.stats,
            };
          })
          .filter((p): p is PlayerWithStats => p !== null);
      };

      const homeTeamData = {
        team: homeTeam,
        tactic: homeTactic,
        players: mapPlayersWithPositions(homePlayers, homeTactic),
      };

      const awayTeamData = {
        team: awayTeam,
        tactic: awayTactic,
        players: mapPlayersWithPositions(awayPlayers, awayTactic),
      };

      // Simulate the match
      const matchResult = await simulateMatch(homeTeamData, awayTeamData);

      // Update team statistics
      const updatedHomeStats = updateTeamStats(
        homeTeam.stats,
        true,
        matchResult,
        homeTactic
      );

      const updatedAwayStats = updateTeamStats(
        awayTeam.stats,
        false,
        matchResult,
        awayTactic
      );

      // Create match record
      const matchData = {
        id: match.id,
        homeTeam: homeTeam.teamName,
        awayTeam: awayTeam.teamName,
        date: match.scheduledDate.toISOString(),
        isCompleted: true,
        homeTactic,
        awayTactic,
        result: {
          homeScore: matchResult.homeScore,
          awayScore: matchResult.awayScore,
        },
        homeStats: matchResult.homeStats,
        awayStats: matchResult.awayStats,
        homePlayerRatings: matchResult.homePlayerRatings,
        awayPlayerRatings: matchResult.awayPlayerRatings,
        events: matchResult.matchEvents,
      };

      // Update both teams with the match result and new statistics
      await Promise.all([
        TeamModel.findByIdAndUpdate(homeTeam._id, {
          $push: { matches: matchData },
          $set: { stats: updatedHomeStats },
        }),
        TeamModel.findByIdAndUpdate(awayTeam._id, {
          $push: { matches: matchData },
          $set: { stats: updatedAwayStats },
        }),
      ]);

      console.log(`Match ${match.id} simulated successfully`);
    } catch (error) {
      console.error(`Error simulating match ${match.id}:`, error);
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getNextMatch(): QueuedMatch | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  public clearQueue(): void {
    this.queue = [];
  }
}

export const matchQueue = MatchQueue.getInstance();