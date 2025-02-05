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
  getActionCooldown,
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
  lastTrainingDate: string | null;
  lastWorkDate: string | null;
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
  const [working, setWorking] = useState(false);
  const [amount, setAmount] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [workSuccess, setWorkSuccess] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);

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

  const handleWork = async () => {
    if (!player || working) return;

    setError(null);
    setWorking(true);
    setWorkSuccess(false);

    try {
      const response = await fetch("/api/game/work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.playerId,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Work failed");
      }

      setPlayer(result.player);
      setEarnedAmount(result.earnedAmount);
      setWorkSuccess(true);

      setTimeout(() => {
        setWorkSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Work failed");
    } finally {
      setWorking(false);
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
      <div className="min-h-screen pb-20">
        <Header pageName="Invest" />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <p className="mt-2 text-green-400">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!player) {
    return null;
  }

  const investmentTotal = calculateInvestments(player.investments);
  const totalCapital = calculateTotalCapital(player.money, player.investments);
  const { onCooldown: workOnCooldown, remainingTime: workTime } =
    getActionCooldown(
      player.lastWorkDate ? new Date(player.lastWorkDate) : null,
      false // isTraining = false
    );

  return (
    <div className="min-h-screen pb-20">
      <Header pageName="Finances" />
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Work Button */}
        <div className="glass-container p-6 mb-6">
          <div className="text-center relative">
            <button
              onClick={handleWork}
              className={`
                gradient-button py-4 px-8 rounded-xl text-xl mb-4 w-full
                ${
                  workOnCooldown || working
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              `}
              disabled={workOnCooldown || working}
            >
              {working ? "WORKING..." : "WORK"}
            </button>

            {/* Work Success Animation */}
            {workSuccess && (
              <div
                key={`work-animation-${Date.now()}`}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full"
              >
                <div className="animate-bounce glass-container bg-green-500/20 text-white px-4 py-2">
                  +{earnedAmount}$
                </div>
              </div>
            )}

            <div
              className={!workOnCooldown ? "text-green-400" : "text-red-400"}
            >
              {!workOnCooldown ? "Ready to work" : `Resting: ${workTime} left`}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="glass-container p-6 mb-6 space-y-4">
          {/* Cash */}
          <div className="glass-container p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Cash:</span>
              <span className="text-xl font-semibold text-green-400">
                {formatCurrency(player.money)}
              </span>
            </div>
          </div>

          {/* Investments */}
          <div className="glass-container p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Investment:</span>
              <span className="text-xl font-semibold text-gray-400">
                {formatCurrency(investmentTotal)}
              </span>
            </div>
          </div>

          {/* Total Capital */}
          <div className="glass-container p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Capital:</span>
              <span className="text-xl font-semibold text-yellow-400">
                {formatCurrency(totalCapital)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="glass-container p-6 space-x-4 flex justify-center">
          <button
            onClick={() => setShowDepositModal(true)}
            disabled={processing}
            className="gradient-button py-3 px-6 rounded-xl"
          >
            Deposit
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={processing}
            className="gradient-button py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400"
          >
            Withdraw
          </button>
        </div>

        {/* Transaction Modal */}
        {(showDepositModal || showWithdrawModal) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-container p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-white">
                {showDepositModal ? "Deposit" : "Withdraw"} Amount
              </h3>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-2 mb-2 rounded-xl bg-black/40 text-white border border-green-500/30"
              />
              {modalError && (
                <div className="text-red-400 text-sm mb-4">{modalError}</div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="gradient-button py-2 px-4 rounded-xl bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleTransaction(showDepositModal ? "deposit" : "withdraw")
                  }
                  disabled={processing || !amount}
                  className={`gradient-button py-2 px-4 rounded-xl ${
                    processing || !amount ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    showDepositModal
                      ? ""
                      : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400"
                  }`}
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
        <div className="glass-container p-4 mt-6 text-sm text-gray-400 text-center">
          Your investments grow by 1% each day. Growth is calculated and applied
          automatically.
        </div>
      </div>
      <Footer />
    </div>
  );
}
