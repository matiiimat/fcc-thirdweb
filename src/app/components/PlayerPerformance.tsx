"use client";

interface PlayerStats {
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  tackles: number;
  saves?: number;
}

interface PlayerRating {
  ethAddress: string;
  position: string;
  rating: number;
  stats: PlayerStats;
}

interface PlayerPerformanceProps {
  playerRatings: PlayerRating[];
  teamName: string;
}

const PlayerPerformance: React.FC<PlayerPerformanceProps> = ({
  playerRatings,
  teamName,
}) => (
  <div className="glass-container bg-black/20 p-4 rounded-lg">
    <h3 className="text-lg font-semibold mb-2">{teamName}</h3>
    <div className="space-y-3">
      {playerRatings
        .sort((a, b) => b.rating - a.rating)
        .map((player) => (
          <div
            key={player.ethAddress}
            className="glass-container bg-black/20 p-3 rounded-lg"
          >
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-medium">
                  {player.ethAddress.slice(0, 6)}...
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  {player.position}
                </span>
              </div>
              <div
                className={`text-lg font-bold ${
                  player.rating >= 8
                    ? "text-green-400"
                    : player.rating >= 6
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {player.rating.toFixed(1)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {player.stats.goals > 0 && (
                <div className="text-green-400">
                  ⚽ {player.stats.goals} goals
                </div>
              )}
              {player.stats.assists > 0 && (
                <div className="text-blue-400">
                  👟 {player.stats.assists} assists
                </div>
              )}
              {player.stats.saves !== undefined && player.stats.saves > 0 && (
                <div className="text-yellow-400">
                  🧤 {player.stats.saves} saves
                </div>
              )}
              <div className="text-gray-400">
                📊 {player.stats.passes} passes
              </div>
              <div className="text-gray-400">
                🛡 {player.stats.tackles} tackles
              </div>
            </div>
          </div>
        ))}
    </div>
  </div>
);

export default PlayerPerformance;
