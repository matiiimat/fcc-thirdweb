interface CreateTeamSectionProps {
  newTeamName: string;
  loading: boolean;
  onNameChange: (name: string) => void;
  onCreateTeam: () => void;
}

export default function CreateTeamSection({
  newTeamName,
  loading,
  onNameChange,
  onCreateTeam,
}: CreateTeamSectionProps) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold mb-3 text-yellow-400">Create Team</h3>
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter team name"
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-400 placeholder-gray-400"
          />
          <button
            onClick={onCreateTeam}
            disabled={loading}
            className="w-full px-4 py-2 rounded bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  );
}
