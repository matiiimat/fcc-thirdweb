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
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-200">Create Team</h3>
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={newTeamName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter team name"
          className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={onCreateTeam}
          disabled={loading}
          className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Team"}
        </button>
      </div>
    </div>
  );
}
