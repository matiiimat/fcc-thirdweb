interface CreateTeamSectionProps {
  loading: boolean;
  onCreateTeam: () => void;
}

export default function CreateTeamSection({
  loading,
  onCreateTeam,
}: CreateTeamSectionProps) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold mb-3 text-yellow-400">Create Team</h3>
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="flex flex-col gap-3">
          <p className="text-gray-300 text-sm">
            A random team name will be generated for your team.
          </p>
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
