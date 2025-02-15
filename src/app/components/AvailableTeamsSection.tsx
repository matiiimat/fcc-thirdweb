import { TEAM_CONSTANTS } from "../lib/constants";

interface Team {
  teamName: string;
  captainAddress: string;
  players: string[];
}

interface AvailableTeamsSectionProps {
  teams: Team[];
  loading: boolean;
  playerAddress: string;
  onJoinTeam: (teamName: string) => void;
}

export default function AvailableTeamsSection({
  teams,
  loading,
  playerAddress,
  onJoinTeam,
}: AvailableTeamsSectionProps) {
  return (
    <div className="mt-2">
      <h3 className="text-xl font-bold mb-3 text-yellow-400">
        Available Teams
      </h3>
      {teams.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-400">No teams available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => {
            const isFull = team.players.length >= TEAM_CONSTANTS.MAX_PLAYERS;
            const isPlayerInTeam = team.players.includes(
              playerAddress.toLowerCase()
            );

            return (
              <div key={team.teamName} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-medium text-white">
                    {team.teamName}
                  </h4>
                  <span className="text-sm px-2 py-1 bg-gray-700 rounded text-green-400">
                    {team.players.length}/{TEAM_CONSTANTS.MAX_PLAYERS}
                  </span>
                </div>

                {isFull && (
                  <p className="text-sm text-yellow-400 mb-2">Team is full</p>
                )}

                <button
                  onClick={() => onJoinTeam(team.teamName)}
                  disabled={loading || isPlayerInTeam || isFull}
                  className={`w-full px-3 py-2 rounded text-white font-medium transition-colors ${
                    isPlayerInTeam
                      ? "bg-gray-600"
                      : isFull
                      ? "bg-gray-600"
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPlayerInTeam
                    ? "Already Joined"
                    : isFull
                    ? "Team Full"
                    : "Join Team"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
