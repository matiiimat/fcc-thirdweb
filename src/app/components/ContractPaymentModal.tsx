import { useState } from "react";
import { useSendTransaction, useAccount } from "wagmi";

interface ContractPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerAddress: string;
  playerId: string;
  amount: number;
  durationInSeasons: number;
  onSuccess: () => void;
}

export default function ContractPaymentModal({
  isOpen,
  onClose,
  playerAddress,
  playerId,
  amount,
  durationInSeasons,
  onSuccess,
}: ContractPaymentModalProps) {
  const [txStatus, setTxStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { sendTransaction } = useSendTransaction();
  const { address } = useAccount();

  if (!isOpen) return null;

  const handlePayment = () => {
    setTxStatus("Processing transaction...");

    // Convert ETH amount to wei (1 ETH = 10^18 wei)
    const amountInWei = BigInt(Math.floor(amount * 1000000000000000000));

    sendTransaction(
      {
        to: playerAddress as `0x${string}`,
        value: amountInWei,
      },
      {
        onSuccess: async (hash) => {
          setTxHash(hash);
          setTxStatus("Transaction confirmed! Activating contract...");
          setIsProcessing(true);

          try {
            // Call the API to update the contract status
            const response = await fetch("/api/contracts/payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-wallet-address": address as string,
              },
              body: JSON.stringify({
                playerId,
                transactionHash: hash,
                durationInSeasons,
              }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || "Failed to activate contract");
            }

            setTxStatus("Contract activated successfully! 🎉");
            onSuccess();
          } catch (error) {
            console.error("Error activating contract:", error);
            setTxStatus(
              `Contract activation failed: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          } finally {
            setIsProcessing(false);
          }
        },
        onError: (error) => {
          console.error("Transaction error:", error);
          setTxStatus(`Transaction failed: ${error.message}`);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-container p-4 w-[90%] max-w-md rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Contract Payment
        </h3>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-300 mb-2">
              You are about to pay{" "}
              <span className="text-green-400 font-semibold">{amount} ETH</span>{" "}
              to:
            </p>
            <p className="text-xs text-gray-400 bg-gray-800 p-2 rounded-lg break-all">
              {playerAddress}
            </p>
          </div>

          {txStatus && (
            <div
              className={`text-center p-2 rounded-lg ${
                txStatus.includes("failed")
                  ? "bg-red-900/30 text-red-400"
                  : txStatus.includes("confirmed")
                  ? "bg-green-900/30 text-green-400"
                  : "bg-blue-900/30 text-blue-400"
              }`}
            >
              {txStatus}
              {txHash && (
                <div className="mt-1 text-xs">
                  Transaction hash:{" "}
                  <span className="font-mono break-all">{txHash}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={!!txHash}
              className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-lg ${
                txHash ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
              }`}
            >
              Pay Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
