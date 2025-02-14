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
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-200">
        Available Teams
      </h3>
      {teams.length === 0 ? (
        <p className="text-gray-400">No teams available</p>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const isFull = team.players.length >= TEAM_CONSTANTS.MAX_PLAYERS;
            const isPlayerInTeam = team.players.includes(
              playerAddress.toLowerCase()
            );

            return (
              <div
                key={team.teamName}
                className="p-4 rounded-lg bg-gray-800 border border-gray-700"
              >
                <h4 className="text-lg font-medium text-gray-200 mb-2">
                  {team.teamName}
                </h4>
                <p className="text-sm text-gray-400 mb-1">
                  Players: {team.players.length}/{TEAM_CONSTANTS.MAX_PLAYERS}
                </p>
                {isFull && (
                  <p className="text-sm text-yellow-400 mb-3">Team is full</p>
                )}
                <button
                  onClick={() => onJoinTeam(team.teamName)}
                  disabled={loading || isPlayerInTeam || isFull}
                  className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
