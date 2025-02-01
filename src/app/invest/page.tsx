"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface PlayerData {
  playerId: string;
  playerName: string;
  ethAddress: string;
  money: number;
  investments: {
    type: string;
    amount: number;
  }[];
}

interface InvestmentAccount {
  type: string;
  balance: number;
}

export default function InvestPage() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxAmount, setTaxAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  // Get account balances from investments array
  const getAccountBalance = (type: string): number => {
    if (!player?.investments) return 0;
    return player.investments
      .filter((inv) => inv.type === type)
      .reduce((sum, inv) => sum + inv.amount, 0);
  };

  const accounts: InvestmentAccount[] = [
    { type: "savings", balance: getAccountBalance("savings") },
    { type: "investment", balance: getAccountBalance("investment") },
  ];

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

  const handleInvestment = async (type: string, action: "add" | "withdraw") => {
    if (!player || processing) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/game/invest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.playerId,
          type,
          action,
          amount: 100, // Fixed amount for now
        }),
      });

      if (!response.ok) {
        throw new Error("Investment failed");
      }

      const result = await response.json();
      setPlayer(result.player);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investment failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleTaxPayment = async () => {
    if (!player || processing || !taxAmount) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/game/invest/tax", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.playerId,
          amount: Number(taxAmount),
        }),
      });

      if (!response.ok) {
        throw new Error("Tax payment failed");
      }

      const result = await response.json();
      setPlayer(result.player);
      setShowTaxModal(false);
      setTaxAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tax payment failed");
    } finally {
      setProcessing(false);
    }
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

  if (!wallet || !player) {
    router.push("/");
    return null;
  }

  return (
    <>
      <Header pageName="Invest" />

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-2xl w-full space-y-6">
          {/* Available Money */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Available Money</h2>
            <p className="text-xl">{player.money}</p>
          </div>

          {/* Investment Options */}
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.type}
                className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {account.type} Account
                  </h3>
                  <p className="text-gray-300">Balance: {account.balance}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleInvestment(account.type, "add")}
                    disabled={processing}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => handleInvestment(account.type, "withdraw")}
                    disabled={processing}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ))}

            {/* Pay Taxes Button */}
            <div className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Pay Taxes</h3>
                <p className="text-gray-300">Pay your withdrawal fees</p>
              </div>
              <button
                onClick={() => setShowTaxModal(true)}
                disabled={processing}
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
              >
                Pay Taxes
              </button>
            </div>
          </div>

          {/* Tax Payment Modal */}
          {showTaxModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-white">Pay Taxes</h3>
                <input
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowTaxModal(false)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTaxPayment}
                    disabled={processing || !taxAmount}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Pay
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-sm text-gray-400 text-center mt-8 p-4 bg-gray-800 rounded-lg">
            The fccFC government enforces a mandatory 10% fee on all
            withdrawals. Ensure you pay this fee each time you withdraw funds
            from your investment account.
          </div>

          {error && (
            <div className="text-red-500 text-center mb-4">{error}</div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
