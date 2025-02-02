"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  calculateInvestments,
  calculateTotalCapital,
  formatCurrency,
} from "../lib/game";

interface PlayerData {
  playerId: string;
  playerName: string;
  ethAddress: string;
  money: number;
  investments: Array<{
    type: string;
    amount: number;
    timestamp: string;
  }>;
}

export default function InvestPage() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    async function fetchPlayer() {
      if (!wallet) {
        setLoading(false);
        router.push("/");
        return;
      }

      try {
        const response = await fetch(
          `/api/players/address/${encodeURIComponent(wallet.address)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch player data");
        }

        const data = await response.json();
        setPlayer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [wallet, router]);

  const handleTransaction = async (action: "deposit" | "withdraw") => {
    if (!player || processing || !amount) return;

    setModalError(null);
    setProcessing(true);
    try {
      const response = await fetch("/api/game/invest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.playerId,
          type: "investment",
          action,
          amount: Number(amount),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Transaction failed");
      }

      setPlayer(result.player);
      setAmount("");
      setShowDepositModal(false);
      setShowWithdrawModal(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setShowDepositModal(false);
    setShowWithdrawModal(false);
    setAmount("");
    setModalError(null);
  };

  if (loading) {
    return (
      <>
        <Header pageName="Invest" />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!player) {
    return null;
  }

  const investmentTotal = calculateInvestments(player.investments);
  const totalCapital = calculateTotalCapital(player.money, player.investments);

  return (
    <>
      <Header pageName="Invest" />
      <div className="flex flex-col items-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Financial Information */}
          <div className="space-y-4">
            {/* Cash */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Cash:</span>
                <span className="text-xl font-semibold text-green-400">
                  {formatCurrency(player.money)}
                </span>
              </div>
            </div>

            {/* Investments */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Investment:</span>
                <span className="text-xl font-semibold text-gray-400">
                  {formatCurrency(investmentTotal)}
                </span>
              </div>
            </div>

            {/* Total Capital */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Capital:</span>
                <span className="text-xl font-semibold text-yellow-400">
                  {formatCurrency(totalCapital)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowDepositModal(true)}
              disabled={processing}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={processing}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Withdraw
            </button>
          </div>

          {/* Transaction Modal */}
          {(showDepositModal || showWithdrawModal) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-white">
                  {showDepositModal ? "Deposit" : "Withdraw"} Amount
                </h3>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
                />
                {modalError && (
                  <div className="text-red-500 text-sm mb-4">{modalError}</div>
                )}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={closeModal}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleTransaction(
                        showDepositModal ? "deposit" : "withdraw"
                      )
                    }
                    disabled={processing || !amount}
                    className={`${
                      showDepositModal
                        ? "bg-green-500 hover:bg-green-700"
                        : "bg-red-500 hover:bg-red-700"
                    } text-white font-bold py-2 px-4 rounded`}
                  >
                    {processing
                      ? "Processing..."
                      : showDepositModal
                      ? "Deposit"
                      : "Withdraw"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Investment Info */}
          <div className="text-sm text-gray-400 text-center mt-8 p-4 bg-gray-800 rounded-lg">
            Your investments grow by 1% each day. Growth is calculated and
            applied automatically.
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
