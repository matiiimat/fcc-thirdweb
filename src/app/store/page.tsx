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
}

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
    description: "Allows to pick a skill to be trained for the 7 days",
    price: 30000,
    section: "Bonuses",
  },
  {
    id: "management_certificate",
    name: "Management Certificate",
    description: "Unlocks advanced team management features",
    price: 40000,
    section: "Certifications",
  },
  {
    id: "training_certificate",
    name: "Training Certificate",
    description: "Unlocks advanced training options",
    price: 20000,
    section: "Certifications",
  },
  {
    id: "finance_certificate",
    name: "Finance Certificate",
    description: "Unlocks advanced financial features",
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

  // Handle navigation when no wallet or player
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

    setError(null);
    setProcessing(item.id);
    try {
      const response = await fetch("/api/game/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.playerId,
          item,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to purchase item");
      }

      // Update player data with new balance
      setPlayer((prev) => (prev ? { ...prev, money: data.newBalance } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to purchase item");
    } finally {
      setProcessing("");
    }
  };

  if (loading) {
    return (
      <>
        <Header pageName="Store" />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!wallet || !player) {
    return null;
  }

  // Group items by section
  const itemsBySection = storeItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, StoreItem[]>);

  return (
    <div className="min-h-screen bg-[#0d0f12] text-white">
      <Header pageName="Store" />
      <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-8rem)]">
        {/* Player's Cash */}
        <div className="bg-gray-800 p-4 rounded-lg mb-8">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Available Cash:</span>
            <span className="text-xl font-semibold text-green-400">
              {formatCurrency(player.money)}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Bonuses Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Bonuses</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            {itemsBySection["Bonuses"].map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={processing === item.id || player.money < item.price}
                  className={`px-4 py-2 rounded-lg ${
                    processing === item.id
                      ? "bg-blue-500/50 cursor-not-allowed"
                      : player.money < item.price
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  } transition-colors ml-4 whitespace-nowrap`}
                >
                  {processing === item.id
                    ? "Buying..."
                    : formatCurrency(item.price)}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Certifications</h2>
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            {itemsBySection["Certifications"].map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={processing === item.id || player.money < item.price}
                  className={`px-4 py-2 rounded-lg ${
                    processing === item.id
                      ? "bg-blue-500/50 cursor-not-allowed"
                      : player.money < item.price
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  } transition-colors ml-4 whitespace-nowrap`}
                >
                  {processing === item.id
                    ? "Buying..."
                    : formatCurrency(item.price)}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
