"use client";

import { useState } from "react";

interface Contract {
  status: "active" | "pending" | "rejected" | "expired";
  requestedAmount: number;
  durationInSeasons: number;
  seasonEnds?: number;
}

interface PlayerContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress: string;
  playerData: {
    contract?: Contract;
  } | null;
  isBottomSheet?: boolean;
}

export default function PlayerContractModal({
  isOpen,
  onClose,
  playerAddress,
  playerData,
  isBottomSheet = false,
}: PlayerContractModalProps) {
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractAmount, setContractAmount] = useState<number>(0.02);
  const [contractDuration, setContractDuration] = useState<number>(2);

  const handleContractRequest = async () => {
    try {
      setContractLoading(true);
      setContractError(null);

      const response = await fetch("/api/contracts/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": playerAddress,
        },
        body: JSON.stringify({
          requestedAmount: contractAmount,
          durationInSeasons: contractDuration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request contract");
      }

      onClose();
      window.location.reload(); // Refresh to update player data
    } catch (error) {
      console.error("Error requesting contract:", error);
      setContractError(
        error instanceof Error ? error.message : "Failed to request contract"
      );
    } finally {
      setContractLoading(false);
    }
  };

  const handleCancelContract = async () => {
    try {
      setContractLoading(true);
      setContractError(null);

      const response = await fetch("/api/contracts/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": playerAddress,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel contract request");
      }

      onClose();
      window.location.reload(); // Refresh to update player data
    } catch (error) {
      console.error("Error canceling contract:", error);
      setContractError(
        error instanceof Error ? error.message : "Failed to cancel contract"
      );
    } finally {
      setContractLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          bg-gradient-to-b from-[#1a1d21] to-[#0d0f12] 
          rounded-t-xl w-full max-w-md h-auto max-h-[75vh] flex flex-col
          transform transition-all duration-300 ease-out
          ${isBottomSheet ? "animate-slide-up" : "animate-fade-in"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Player Contract</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {contractError && (
            <div className="mb-4 p-3 rounded-lg text-center bg-red-500/20 text-red-300">
              {contractError}
            </div>
          )}

          {playerData?.contract ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span
                  className={`font-medium ${
                    playerData.contract.status === "active"
                      ? "text-green-400"
                      : playerData.contract.status === "pending"
                      ? "text-yellow-400"
                      : playerData.contract.status === "rejected"
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {playerData.contract.status.charAt(0).toUpperCase() +
                    playerData.contract.status.slice(1)}
                </span>
              </div>

              {playerData.contract.status === "active" && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">
                      {playerData.contract.requestedAmount} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">
                      {playerData.contract.durationInSeasons} seasons
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Expires:</span>
                    <span className="text-white">
                      Season {playerData.contract.seasonEnds}
                    </span>
                  </div>
                </>
              )}

              {playerData.contract.status === "pending" && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Requested:</span>
                    <span className="text-white">
                      {playerData.contract.requestedAmount} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">
                      {playerData.contract.durationInSeasons} seasons
                    </span>
                  </div>
                  <div className="flex flex-col items-center mt-4">
                    <div className="text-yellow-400 text-sm mb-4">
                      Waiting for captain approval
                    </div>
                    <button
                      onClick={handleCancelContract}
                      disabled={contractLoading}
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {contractLoading ? "Canceling..." : "Cancel Request"}
                    </button>
                  </div>
                </>
              )}

              {(playerData.contract.status === "rejected" ||
                playerData.contract.status === "expired") && (
                <div className="mt-4">
                  <p className="text-gray-300 mb-4">
                    {playerData.contract.status === "rejected"
                      ? "Your contract request was rejected by the team captain."
                      : "Your contract has expired. You can request a new one."}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-1">
                        Contract Amount (ETH)
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={contractAmount}
                        onChange={(e) =>
                          setContractAmount(parseFloat(e.target.value))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">
                        Duration (Seasons)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={contractDuration}
                        onChange={(e) =>
                          setContractDuration(parseInt(e.target.value))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <button
                      onClick={handleContractRequest}
                      disabled={contractLoading}
                      className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {contractLoading
                        ? "Requesting..."
                        : "Request New Contract"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-300 mb-4">
                You don't have a contract with this team. Request one to secure
                your position and earn ETH.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-1">
                    Contract Amount (ETH)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={contractAmount}
                    onChange={(e) =>
                      setContractAmount(parseFloat(e.target.value))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">
                    Duration (Seasons)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={contractDuration}
                    onChange={(e) =>
                      setContractDuration(parseInt(e.target.value))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <button
                  onClick={handleContractRequest}
                  disabled={contractLoading}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {contractLoading ? "Requesting..." : "Request Contract"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
