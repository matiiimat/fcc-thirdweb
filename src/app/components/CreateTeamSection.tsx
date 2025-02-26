import React from "react";

interface CreateTeamSectionProps {
  loading: boolean;
  onCreateTeam: () => void;
  hasCertificate?: boolean;
}

export default function CreateTeamSection({
  loading,
  onCreateTeam,
  hasCertificate = false,
}: CreateTeamSectionProps) {
  return (
    <div className="glass-container p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold text-white mb-2">Create a Team</h2>
      <p className="text-gray-400 text-sm mb-4">
        Start your journey as a team manager. Your team name will be
        automatically generated based on your wallet address.
      </p>
      <button
        onClick={onCreateTeam}
        disabled={loading || !hasCertificate}
        className={`gradient-button w-full py-2 rounded-lg text-sm ${
          loading || !hasCertificate ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Creating..." : "Create Team"}
      </button>
      {!hasCertificate && (
        <p className="text-yellow-400 text-xs mt-2 text-center">
          You need a Management Certificate to create a team. Visit the Store to
          purchase one.
        </p>
      )}
    </div>
  );
}
