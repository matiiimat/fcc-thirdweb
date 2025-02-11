"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LoadingState from "../components/LoadingState";
import StoreSection from "../components/StoreSection";
import SkillSelectionModal from "../components/SkillSelectionModal";
import { PlayerData, StoreItem } from "../lib/store-types";
import { storeItems } from "../lib/store-constants";

export default function Store() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string>("");
  const [showSkillModal, setShowSkillModal] = useState(false);
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

    if (player.xp < item.price) {
      setError("Not enough XP");
      return;
    }

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
              xp: data.newXp,
              privateTrainer: data.privateTrainer,
            }
          : null
      );

      setShowSkillModal(false);
      setPendingPurchase(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to purchase item");
    } finally {
      setProcessing("");
    }
  };

  if (loading) {
    return <LoadingState pageName="Store" />;
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
      <Header pageName="Store" xp={player.xp} />
      <main className="container max-w-2xl mx-auto px-3 sm:px-6 py-2 sm:py-6 pb-16">
        {error && (
          <div className="glass-container border-red-500/50 text-red-400 px-3 py-2 mb-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="glass-container p-2 sm:p-6 rounded-lg sm:rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 gap-2">
            <StoreSection
              title="Bonuses"
              items={itemsBySection["Bonuses"]}
              player={player}
              processing={processing}
              onPurchase={handlePurchase}
            />

            <div className="mt-3">
              <StoreSection
                title="Certifications"
                items={itemsBySection["Certifications"]}
                player={player}
                processing={processing}
                onPurchase={handlePurchase}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showSkillModal && (
        <SkillSelectionModal
          onClose={() => {
            setShowSkillModal(false);
            setPendingPurchase(null);
          }}
          onConfirm={(skill) => {
            if (pendingPurchase) {
              processPurchase(pendingPurchase, skill);
            }
          }}
          processing={processing !== ""}
        />
      )}
    </div>
  );
}
