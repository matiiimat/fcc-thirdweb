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
  attempts?: number;
}

const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 30_000;

interface PlayerWithStats {
  ethAddress: string;
  position: Position;
  stats: IPlayer["stats"];
}

class MatchQueue {
  private static instance: MatchQueue;
  private queue: QueuedMatch[] = [];
  private isProcessing: boolean = false;
  private nextTimer: ReturnType<typeof setTimeout> | null = null;
  private nextTimerTarget: number | null = null;

  private constructor() {}

  private scheduleNextRun(): void {
    if (this.queue.length === 0) return;
    const target = this.queue[0].scheduledDate.getTime();
    const delay = Math.max(0, target - Date.now());

    if (this.nextTimer && this.nextTimerTarget !== null && this.nextTimerTarget <= target) {
      return;
    }
    if (this.nextTimer) {
      clearTimeout(this.nextTimer);
    }
    this.nextTimerTarget = target;
    this.nextTimer = setTimeout(() => {
      this.nextTimer = null;
      this.nextTimerTarget = null;
      void this.processQueue();
    }, delay);
  }

  public static getInstance(): MatchQueue {
    if (!MatchQueue.instance) {
      MatchQueue.instance = new MatchQueue();
    }
    return MatchQueue.instance;
  }

  public async addMatch(match: QueuedMatch): Promise<void> {
    this.queue.push(match);
    this.queue.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    this.scheduleNextRun();

    if (!this.isProcessing && this.queue[0]?.scheduledDate.getTime() <= Date.now()) {
      await this.processQueue();
    }
  }

  public async addMatches(matches: QueuedMatch[]): Promise<void> {
    this.queue.push(...matches);
    this.queue.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    this.scheduleNextRun();

    if (!this.isProcessing && this.queue[0]?.scheduledDate.getTime() <= Date.now()) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && this.queue[0].scheduledDate.getTime() <= Date.now()) {
        const match = this.queue.shift();
        if (!match) continue;

        const ok = await this.simulateMatch(match);
        if (!ok) {
          const attempts = (match.attempts ?? 0) + 1;
          if (attempts < MAX_ATTEMPTS) {
            this.queue.push({
              ...match,
              attempts,
              scheduledDate: new Date(Date.now() + RETRY_BACKOFF_MS * attempts),
            });
            this.queue.sort(
              (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
            );
          } else {
            console.error(
              `Match ${match.id} dropped after ${attempts} failed attempts`
            );
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }

    this.scheduleNextRun();
  }

  private async simulateMatch(match: QueuedMatch): Promise<boolean> {
    try {
      // Fetch teams with their players
      const [homeTeam, awayTeam] = await Promise.all([
        TeamModel.findById(match.homeTeamId),
        TeamModel.findById(match.awayTeamId),
      ]);

      if (!homeTeam || !awayTeam) {
        console.error(`Teams not found for match ${match.id}`);
        return false;
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
        return false;
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

      // Create match record — shared fields, then per-team perspective
      const baseMatchData = {
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

      const homeRecord = { ...baseMatchData, isHome: true, opponent: awayTeam.teamName };
      const awayRecord = { ...baseMatchData, isHome: false, opponent: homeTeam.teamName };

      await Promise.all([
        TeamModel.findByIdAndUpdate(homeTeam._id, {
          $push: { matches: homeRecord },
          $set: { stats: updatedHomeStats },
        }),
        TeamModel.findByIdAndUpdate(awayTeam._id, {
          $push: { matches: awayRecord },
          $set: { stats: updatedAwayStats },
        }),
      ]);

      console.log(`Match ${match.id} simulated successfully`);
      return true;
    } catch (error) {
      console.error(`Error simulating match ${match.id}:`, error);
      return false;
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
    if (this.nextTimer) {
      clearTimeout(this.nextTimer);
      this.nextTimer = null;
      this.nextTimerTarget = null;
    }
  }
}

export const matchQueue = MatchQueue.getInstance();