"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface PlayerData {
  playerId: string;
  money: number;
  privateTrainer?: {
    selectedSkill: string | null;
    remainingSessions: number;
  };
}

interface SkillOption {
  value: string;
  label: string;
}

const skillOptions: SkillOption[] = [
  { value: "strength", label: "Strength" },
  { value: "stamina", label: "Stamina" },
  { value: "passing", label: "Passing" },
  { value: "shooting", label: "Shooting" },
  { value: "defending", label: "Defending" },
  { value: "speed", label: "Speed" },
  { value: "positioning", label: "Positioning" },
];

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  section: string;
}

const storeItems: StoreItem[] = [
  {
    id: "private_trainer",
    name: "Private Trainer",
    description: "Train skill for 7 sessions",
    price: 300,
    section: "Bonuses",
  },
  {
    id: "management_certificate",
    name: "Management Cert.",
    description: "Team management license",
    price: 40000,
    section: "Certifications",
  },
  {
    id: "training_certificate",
    name: "Training Cert.",
    description: "Team training license",
    price: 20000,
    section: "Certifications",
  },
  {
    id: "finance_certificate",
    name: "Finance Cert.",
    description: "Team finance license",
    price: 20000,
    section: "Certifications",
  },
];

export default function Store() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string>("");
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<StoreItem | null>(
    null
  );

  useEffect(() => {
    if (!loading && (!wallet || !player)) {
      router.push("/");
    }
  }, [loading, wallet, player, router]);

  useEffect(() => {
    async function fetchPlayer() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/players/address/${encodeURIComponent(wallet.address)}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/createPlayer");
            return;
          }
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

  const handlePurchase = async (item: StoreItem) => {
    if (!player || processing) return;

    if (item.id === "private_trainer") {
      setPendingPurchase(item);
      setShowSkillModal(true);
      return;
    }

    await processPurchase(item);
  };

  const processPurchase = async (item: StoreItem, selectedSkill?: string) => {
    if (!wallet) return;

    setError(null);
    setProcessing(item.id);
    try {
      const response = await fetch("/api/game/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": wallet.address,
        },
        body: JSON.stringify({
          playerId: player?.playerId,
          item,
          selectedSkill,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to purchase item");
      }

      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              money: data.newBalance,
              privateTrainer: data.privateTrainer,
            }
          : null
      );

      // Reset modal state
      setShowSkillModal(false);
      setPendingPurchase(null);
      setSelectedSkill(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to purchase item");
    } finally {
      setProcessing("");
    }
  };

  const handleSkillSelect = async () => {
    if (!pendingPurchase || !selectedSkill) return;
    await processPurchase(pendingPurchase, selectedSkill);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Store" />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <p className="mt-2 text-green-400">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!wallet || !player) {
    return null;
  }

  const itemsBySection = storeItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, StoreItem[]>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Store" />
      <main className="container max-w-2xl mx-auto px-3 sm:px-6 py-2 sm:py-6 pb-16">
        {/* Player's Cash */}
        <div className="glass-container p-2 sm:p-6 mb-2 sm:mb-6 rounded-lg sm:rounded-2xl shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm sm:text-base">Cash</span>
            <span className="text-base sm:text-xl font-semibold text-green-400">
              {player.money.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="glass-container border-red-500/50 text-red-400 px-3 py-2 mb-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Store Items */}
        <div className="glass-container p-2 sm:p-6 rounded-lg sm:rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 gap-2">
            {/* Bonuses Section */}
            <div>
              <h2 className="text-base font-bold text-white mb-2">Bonuses</h2>
              <div className="space-y-2">
                {itemsBySection["Bonuses"].map((item) => (
                  <div
                    key={item.id}
                    className="glass-container p-2 rounded-lg transition-all duration-300 active:bg-[#1a1d21]/50 sm:hover:bg-[#1a1d21]/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handlePurchase(item)}
                          disabled={
                            processing === item.id ||
                            player.money < item.price ||
                            (item.id === "private_trainer" &&
                              (player.privateTrainer?.remainingSessions ?? 0) >
                                0)
                          }
                          className={`gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs ${
                            processing === item.id ||
                            player.money < item.price ||
                            (item.id === "private_trainer" &&
                              (player.privateTrainer?.remainingSessions ?? 0) >
                                0)
                              ? "opacity-50 cursor-not-allowed"
                              : "active:scale-95"
                          }`}
                        >
                          {processing === item.id
                            ? "..."
                            : item.price.toLocaleString()}
                        </button>
                      </div>
                    </div>
                    {item.id === "private_trainer" && player.privateTrainer && (
                      <div className="mt-1 text-xs text-center text-gray-400">
                        {player.privateTrainer.remainingSessions} sessions left
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Section */}
            <div className="mt-3">
              <h2 className="text-base font-bold text-white mb-2">
                Certifications
              </h2>
              <div className="space-y-2">
                {itemsBySection["Certifications"].map((item) => (
                  <div
                    key={item.id}
                    className="glass-container p-2 rounded-lg transition-all duration-300 active:bg-[#1a1d21]/50 sm:hover:bg-[#1a1d21]/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">
                          {item.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={
                          processing === item.id || player.money < item.price
                        }
                        className={`gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs ${
                          processing === item.id || player.money < item.price
                            ? "opacity-50 cursor-not-allowed"
                            : "active:scale-95"
                        }`}
                      >
                        {processing === item.id
                          ? "..."
                          : item.price.toLocaleString()}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Skill Selection Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="glass-container p-3 w-full max-h-[80vh] sm:max-w-md rounded-t-xl sm:rounded-xl shadow-lg overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-2">
              Select Training Skill
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {skillOptions.map((skill) => (
                <button
                  key={skill.value}
                  onClick={() => setSelectedSkill(skill.value)}
                  className={`text-center p-2 rounded-lg transition-all duration-300 text-sm ${
                    selectedSkill === skill.value
                      ? "bg-green-700 text-white shadow-lg"
                      : "active:bg-green-900/50 text-gray-300"
                  }`}
                >
                  {skill.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSkillModal(false);
                  setPendingPurchase(null);
                  setSelectedSkill(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 active:bg-gray-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSkillSelect}
                disabled={!selectedSkill}
                className={`flex-1 gradient-button px-4 py-2 rounded-lg text-sm ${
                  !selectedSkill
                    ? "opacity-50 cursor-not-allowed"
                    : "active:scale-95"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
