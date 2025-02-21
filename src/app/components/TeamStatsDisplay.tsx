"use client";

import { ITeamStats } from "../models/Team";
import {
  calculateWinRate,
  calculateGoalDifference,
  calculateAverageGoalsScored,
  calculateAverageGoalsConceded,
  calculateCleanSheetPercentage,
  getTacticEffectiveness,
  getTeamForm,
} from "../lib/teamStats";

interface TeamStatsDisplayProps {
  stats: ITeamStats;
}

export default function TeamStatsDisplay({ stats }: TeamStatsDisplayProps) {
  const winRate = calculateWinRate(stats);
  const goalDiff = calculateGoalDifference(stats);
  const avgGoalsScored = calculateAverageGoalsScored(stats);
  const avgGoalsConceded = calculateAverageGoalsConceded(stats);
  const cleanSheetPercentage = calculateCleanSheetPercentage(stats);
  const tacticEffectiveness = getTacticEffectiveness(stats);
  const teamForm = getTeamForm(stats);

  const getFormColor = (form: string) => {
    switch (form) {
      case "Excellent":
        return "text-green-400";
      case "Good":
        return "text-blue-400";
      case "Average":
        return "text-yellow-400";
      case "Poor":
        return "text-orange-400";
      default:
        return "text-red-400";
    }
  };

  const StatBox = ({
    label,
    value,
    color = "text-white",
  }: {
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <div className="glass-container bg-black/20 p-3 rounded-lg">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Team Performance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatBox
            label="Form"
            value={teamForm}
            color={getFormColor(teamForm)}
          />
          <StatBox
            label="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            color={winRate >= 50 ? "text-green-400" : "text-red-400"}
          />
          <StatBox label="Games Played" value={stats.gamesPlayed} />
          <StatBox
            label="Record"
            value={`${stats.wins}W ${stats.draws}D ${stats.losses}L`}
          />
          <StatBox
            label="Goal Difference"
            value={goalDiff >= 0 ? `+${goalDiff}` : goalDiff}
            color={
              goalDiff > 0
                ? "text-green-400"
                : goalDiff < 0
                ? "text-red-400"
                : "text-gray-400"
            }
          />
          <StatBox
            label="Clean Sheets"
            value={`${cleanSheetPercentage.toFixed(1)}%`}
            color="text-blue-400"
          />
        </div>
      </div>

      {/* Goal Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Goal Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-container bg-black/20 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-2">Goals</div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-400">Scored</div>
                <div className="text-lg font-bold text-green-400">
                  {stats.goalsFor}
                </div>
                <div className="text-xs text-gray-400">
                  {avgGoalsScored.toFixed(1)} per game
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-600">-</div>
              <div>
                <div className="text-xs text-gray-400">Conceded</div>
                <div className="text-lg font-bold text-red-400">
                  {stats.goalsAgainst}
                </div>
                <div className="text-xs text-gray-400">
                  {avgGoalsConceded.toFixed(1)} per game
                </div>
              </div>
            </div>
          </div>

          <div className="glass-container bg-black/20 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-2">Results</div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-400">Wins</div>
                <div className="text-lg font-bold text-green-400">
                  {stats.wins}
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-400">Draws</div>
                <div className="text-lg font-bold text-yellow-400">
                  {stats.draws}
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-400">Losses</div>
                <div className="text-lg font-bold text-red-400">
                  {stats.losses}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tactics Performance */}
      {stats.tacticsUsed.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Tactics Performance</h3>
          <div className="space-y-3">
            {tacticEffectiveness.map(({ name, effectiveness }) => (
              <div
                key={name}
                className="glass-container bg-black/20 p-3 rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">{name}</div>
                  <div
                    className={`text-sm font-bold ${
                      effectiveness >= 60
                        ? "text-green-400"
                        : effectiveness >= 40
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {effectiveness.toFixed(1)}% effective
                  </div>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      effectiveness >= 60
                        ? "bg-green-500"
                        : effectiveness >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${effectiveness}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {stats.tacticsUsed.find((t) => t.name === name)
                    ?.gamesPlayed || 0}{" "}
                  games played
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
