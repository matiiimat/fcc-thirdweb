"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatCurrency } from "../lib/game";

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
    description: "Allows to pick a skill to be trained for the next 7 sessions",
    price: 300,
    section: "Bonuses",
  },
  {
    id: "management_certificate",
    name: "Management Certificate",
    description: "Required to manage a team",
    price: 40000,
    section: "Certifications",
  },
  {
    id: "training_certificate",
    name: "Training Certificate",
    description: "Required to manage a team",
    price: 20000,
    section: "Certifications",
  },
  {
    id: "finance_certificate",
    name: "Finance Certificate",
    description: "Required to manage a team",
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
    setError(null);
    setProcessing(item.id);
    try {
      const response = await fetch("/api/game/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      <div className="min-h-screen">
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
    <div className="min-h-screen">
      <Header pageName="Store" />
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* Player's Cash */}
        <div className="glass-container p-6 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Available Cash:</span>
            <span className="text-xl font-semibold text-green-400">
              {formatCurrency(player.money)}
            </span>
          </div>
        </div>

        {error && (
          <div className="glass-container border-red-500/50 text-red-400 px-6 py-4 mb-6">
            {error}
          </div>
        )}

        {/* Bonuses Section */}
        <div className="glass-container p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Bonuses</h2>
          <div className="space-y-4">
            {itemsBySection["Bonuses"].map((item) => (
              <div key={item.id} className="glass-container p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={
                        processing === item.id ||
                        player.money < item.price ||
                        (item.id === "private_trainer" &&
                          (player.privateTrainer?.remainingSessions ?? 0) > 0)
                      }
                      className={`gradient-button px-4 py-2 rounded-xl ml-4 whitespace-nowrap ${
                        (processing === item.id ||
                          player.money < item.price ||
                          (item.id === "private_trainer" &&
                            (player.privateTrainer?.remainingSessions ?? 0) >
                              0)) &&
                        "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {processing === item.id
                        ? "Buying..."
                        : formatCurrency(item.price)}
                    </button>
                    {item.id === "private_trainer" && player.privateTrainer && (
                      <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 w-48 p-2 bg-black/90 text-white text-xs rounded-lg">
                        Private trainer active:{" "}
                        {player.privateTrainer.remainingSessions} sessions
                        remaining
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications Section */}
        <div className="glass-container p-6">
          <h2 className="text-xl font-bold text-white mb-4">Certifications</h2>
          <div className="space-y-4">
            {itemsBySection["Certifications"].map((item) => (
              <div key={item.id} className="glass-container p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={
                      processing === item.id || player.money < item.price
                    }
                    className={`gradient-button px-4 py-2 rounded-xl ml-4 whitespace-nowrap ${
                      (processing === item.id || player.money < item.price) &&
                      "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {processing === item.id
                      ? "Buying..."
                      : formatCurrency(item.price)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />

      {/* Skill Selection Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-container p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">
              Select Skill to Train
            </h2>
            <p className="text-gray-300 mb-4">
              Choose which skill you want to focus on for the next 7 training
              sessions:
            </p>
            <div className="space-y-2">
              {skillOptions.map((skill) => (
                <button
                  key={skill.value}
                  onClick={() => setSelectedSkill(skill.value)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedSkill === skill.value
                      ? "bg-green-700 text-white"
                      : "hover:bg-green-900/50 text-gray-300"
                  }`}
                >
                  {skill.label}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSkillModal(false);
                  setPendingPurchase(null);
                  setSelectedSkill(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSkillSelect}
                disabled={!selectedSkill}
                className={`gradient-button px-4 py-2 rounded-lg ${
                  !selectedSkill && "opacity-50 cursor-not-allowed"
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
