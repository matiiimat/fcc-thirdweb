"use client";

import { useEffect, useState } from "react";
import { useActiveWallet, TransactionButton } from "thirdweb/react";
import { sepolia } from "thirdweb/chains";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import NameChangeModal from "../components/NameChangeModal";
import { client } from "../client";
import { sep } from "path";

interface PlayerData {
  playerId: string;
  money: number;
  privateTrainer?: {
    selectedSkill: string | null;
    remainingSessions: number;
  };
  managementCertificate?: boolean;
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
    id: "name_change",
    name: "Name Change",
    description: "Change your player name",
    price: 10000,
    section: "Buy",
  },
  {
    id: "private_trainer",
    name: "Private Trainer",
    description: "Train specific skill for 5 sessions",
    price: 1000,
    section: "Buy",
  },
  {
    id: "management_certificate",
    name: "Management Certificate",
    description: "Team management license",
    price: 1, // TO DO: Change price to $5 WHEN LIVE
    section: "Buy",
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
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<StoreItem | null>(
    null
  );
  const [txStatus, setTxStatus] = useState<string>("");
  const recipientAddress = "0xE2A190F13b023f2675bd14B4f3efFEEB1f713641";

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

  const processPurchase = async (
    item: StoreItem,
    selectedSkill?: string,
    newName?: string
  ) => {
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
          newName,
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
              playerName: data.newName,
              privateTrainer: data.privateTrainer,
              managementCertificate:
                data.managementCertificate || prev.managementCertificate,
            }
          : null
      );
      // Reset modal state
      setShowSkillModal(false);
      setShowNameModal(false);
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

  // Handler for name change transaction success:
  const handleSuccessNameChange = () => {
    console.log("Transaction confirmed for name change! 🎉");
    setTxStatus("Transaction confirmed for name change! 🎉");
    const nameChangeItem = storeItems.find((item) => item.id === "name_change");
    if (nameChangeItem) {
      setPendingPurchase(nameChangeItem);
      setShowNameModal(true);
    }
  };

  // Handler for private trainer transaction success:
  const handleSuccessPrivateTrainer = () => {
    console.log("Transaction confirmed for private trainer! 🎉");
    setTxStatus("Transaction confirmed! 🎉");
    const privateTrainerItem = storeItems.find(
      (item) => item.id === "private_trainer"
    );
    if (privateTrainerItem) {
      setPendingPurchase(privateTrainerItem);
      setShowSkillModal(true);
    }
  };

  // Handler for management certificate transaction success:
  const handleSuccessManagementCertificate = () => {
    console.log("Transaction confirmed for management certificate! 🎉");
    setTxStatus("Transaction confirmed! 🎉");
    const managementCertificateItem = storeItems.find(
      (item) => item.id === "management_certificate"
    );
    if (managementCertificateItem) {
      // Process the purchase to update the database
      processPurchase(managementCertificateItem);
    }
  };

  // Handle transaction errors
  const handleError = (error: Error) => {
    console.log("ERROR", error);
    setTxStatus(`Transaction failed: ${error.message}`);
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
        {error && (
          <div className="glass-container border-red-500/50 text-red-400 px-3 py-2 mb-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Name Change Modal */}
        {showNameModal && (
          <NameChangeModal
            isOpen={showNameModal}
            onClose={() => {
              setShowNameModal(false);
              setPendingPurchase(null);
            }}
            onConfirm={async (newName) => {
              if (!pendingPurchase) return;
              await processPurchase(pendingPurchase, undefined, newName);
              setShowNameModal(false);
            }}
            processing={processing !== ""}
          />
        )}

        {/* Store Items */}
        <div className="glass-container p-2 sm:p-6 rounded-lg sm:rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 gap-2">
            {/* Buy Section */}
            <div>
              <h2 className="text-base font-bold text-white mb-2">Buy</h2>
              <div className="space-y-2">
                {itemsBySection["Buy"].map((item) => (
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
                        {item.id === "name_change" ? (
                          <TransactionButton
                            transaction={async () => ({
                              to: recipientAddress,
                              value: 1000000000000000n, // Adjust ETH value as needed
                              chain: sepolia,
                              client: client,
                            })}
                            onTransactionConfirmed={handleSuccessNameChange}
                            onError={handleError}
                          >
                            0.001 ETH
                          </TransactionButton>
                        ) : item.id === "private_trainer" ? (
                          <TransactionButton
                            transaction={async () => ({
                              to: recipientAddress,
                              value: 1000000000000000n, // Adjust ETH value as needed
                              chain: sepolia,
                              client: client,
                            })}
                            onTransactionConfirmed={handleSuccessPrivateTrainer}
                            onError={handleError}
                          >
                            0.001 ETH
                          </TransactionButton>
                        ) : item.id === "management_certificate" ? (
                          player.managementCertificate ? (
                            <button
                              disabled
                              className="gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs opacity-50 cursor-not-allowed"
                            >
                              Owned
                            </button>
                          ) : (
                            <TransactionButton
                              transaction={async () => ({
                                to: recipientAddress,
                                value: 5000000000000000n, // Adjust ETH value as needed
                                chain: sepolia,
                                client: client,
                              })}
                              onTransactionConfirmed={
                                handleSuccessManagementCertificate
                              }
                              onError={handleError}
                            >
                              0.005 ETH
                            </TransactionButton>
                          )
                        ) : (
                          <button
                            onClick={() => {}}
                            className="gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs"
                          >
                            BUY
                          </button>
                        )}
                      </div>
                    </div>
                    {item.id === "private_trainer" && player.privateTrainer && (
                      <div className="mt-1 text-xs text-center text-gray-400">
                        {player.privateTrainer.remainingSessions} sessions left
                      </div>
                    )}
                    {item.id === "management_certificate" &&
                      player.managementCertificate && (
                        <div className="mt-1 text-xs text-center text-green-400">
                          Certificate already acquired
                        </div>
                      )}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="glass-container p-3 w-[90%] max-h-[80vh] sm:max-w-md rounded-xl shadow-lg overflow-y-auto">
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
                disabled={!selectedSkill || processing !== ""}
                className={`flex-1 gradient-button px-4 py-2 rounded-lg text-sm ${
                  !selectedSkill || processing
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
