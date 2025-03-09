"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/frame-sdk";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
} from "wagmi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConfettiEffect from "../components/ConfettiEffect";
import NameChangeModal from "../components/NameChangeModal";
import { sep } from "path";

interface PlayerData {
  playerId: string;
  money: number;
  privateTrainer?: {
    selectedSkill: string | null;
    remainingSessions: number;
  };
  leaveOfAbsence?: {
    expirationDate: string | null;
    daysRemaining: number;
  };
  managementCertificate?: boolean;
  lastEnergyDrinkDate?: string | null;
  energyDrinkPurchases?: {
    count: number;
    resetTime: string | null;
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
    id: "management_certificate",
    name: "Management Certificate",
    description: "Team management license",
    price: 1, // TO DO: Change price to $5 WHEN LIVE
    section: "Buy",
  },
  {
    id: "energy_drink",
    name: "Energy Drink",
    description: "Reset training cooldown",
    price: 1000,
    section: "Buy",
  },
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
    id: "leave_of_absence",
    name: "Leave of Absence",
    description: "Maintain work ethic for 5 days while inactive",
    price: 10000,
    section: "Buy",
  },
];

export default function Store() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { sendTransaction } = useSendTransaction();

  // Farcaster Frame Integration
  useEffect(() => {
    const load = async () => {
      try {
        await sdk.actions.ready();
        setContext(await sdk.context);
      } catch (error) {
        console.error("Error initializing Farcaster Frame SDK:", error);
      }
    };

    if (!isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    // Reset confetti after animation duration
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);
  const recipientAddress = "0xE2A190F13b023f2675bd14B4f3efFEEB1f713641";

  useEffect(() => {
    if (!loading && (!isConnected || !address || !player)) {
      router.push("/");
    }
  }, [loading, isConnected, address, player, router]);

  useEffect(() => {
    async function fetchPlayer() {
      if (!isConnected || !address) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `/api/players/address/${encodeURIComponent(address)}`
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
  }, [isConnected, address, router]);

  const processPurchase = async (
    item: StoreItem,
    selectedSkill?: string,
    newName?: string
  ) => {
    if (!isConnected || !address) return;
    setError(null);
    setProcessing(item.id);
    try {
      const response = await fetch("/api/game/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
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
              leaveOfAbsence: data.leaveOfAbsence || prev.leaveOfAbsence,
              managementCertificate:
                data.managementCertificate || prev.managementCertificate,
              lastTrainingDate: data.lastTrainingDate,
              energyDrinkPurchases:
                data.energyDrinkPurchases || prev.energyDrinkPurchases,
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
      triggerConfetti(); // Trigger confetti after successful purchase
    }
  };

  const handleSkillSelect = async () => {
    if (!pendingPurchase || !selectedSkill) return;
    await processPurchase(pendingPurchase, selectedSkill);
  };

  // Management Certificate transaction using wagmi
  const sendManagementCertificateTx = useCallback(() => {
    sendTransaction(
      {
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        value: 5000000000000000n, // 0.005 ETH in wei (5 * 10^15)
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
          console.log("Transaction sent for management certificate! 🎉", hash);
          setTxStatus("Transaction confirmed! 🎉");

          // Find the management certificate item
          const managementCertificateItem = storeItems.find(
            (item) => item.id === "management_certificate"
          );

          if (managementCertificateItem) {
            // Process the purchase to update the database
            processPurchase(managementCertificateItem);
          }
        },
        onError: (error) => {
          handleError(error);
        },
      }
    );
  }, [sendTransaction, processPurchase]);

  // Name Change transaction using wagmi
  const sendNameChangeTx = useCallback(() => {
    sendTransaction(
      {
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        value: 1000000000000000n, // 0.001 ETH in wei (10^15)
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
          console.log("Transaction sent for name change! 🎉", hash);
          setTxStatus("Transaction confirmed for name change! 🎉");

          // Find the name change item
          const nameChangeItem = storeItems.find(
            (item) => item.id === "name_change"
          );

          if (nameChangeItem) {
            setPendingPurchase(nameChangeItem);
            setShowNameModal(true);
          }
        },
        onError: (error) => {
          handleError(error);
        },
      }
    );
  }, [sendTransaction]);

  // Leave of Absence transaction using wagmi
  const sendLeaveOfAbsenceTx = useCallback(() => {
    sendTransaction(
      {
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        value: 1000000000000000n, // 0.001 ETH in wei (10^15)
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
          console.log("Transaction sent for leave of absence! 🎉", hash);
          setTxStatus("Transaction confirmed! 🎉");

          // Find the leave of absence item
          const leaveOfAbsenceItem = storeItems.find(
            (item) => item.id === "leave_of_absence"
          );

          if (leaveOfAbsenceItem) {
            // Process the purchase to update the database
            processPurchase(leaveOfAbsenceItem);
          }
        },
        onError: (error) => {
          handleError(error);
        },
      }
    );
  }, [sendTransaction, processPurchase]);

  // Calculate energy drink price based on purchase count within 24 hours
  const getEnergyDrinkPrice = () => {
    const basePrice = 1000000000000000n; // 0.001 ETH

    if (!player?.energyDrinkPurchases?.resetTime) {
      return basePrice;
    }

    const resetTime = new Date(player.energyDrinkPurchases.resetTime);
    const now = new Date();
    const hoursSinceReset =
      (now.getTime() - resetTime.getTime()) / (1000 * 60 * 60);

    // If it's been more than 24 hours, return base price
    if (hoursSinceReset >= 24) {
      return basePrice;
    }

    // Calculate price multiplier: 2^count
    // For count = 1: 2^1 = 2x price (0.002 ETH)
    // For count = 2: 2^2 = 4x price (0.004 ETH)
    // For count = 3: 2^3 = 8x price (0.008 ETH)
    // For count = 4: 2^4 = 16x price (0.016 ETH)
    const multiplier = 2n ** BigInt(player.energyDrinkPurchases.count);
    return basePrice * multiplier;
  };

  // Energy Drink transaction using wagmi
  const sendEnergyDrinkTx = useCallback(() => {
    sendTransaction(
      {
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        value: getEnergyDrinkPrice(), // Dynamic price based on previous purchases
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
          console.log("Transaction sent for energy drink! 🎉", hash);
          setTxStatus("Transaction confirmed! 🎉");

          // Find the energy drink item
          const energyDrinkItem = storeItems.find(
            (item) => item.id === "energy_drink"
          );

          if (energyDrinkItem) {
            // Process the purchase to update the database
            processPurchase(energyDrinkItem);
          }
        },
        onError: (error) => {
          handleError(error);
        },
      }
    );
  }, [sendTransaction, processPurchase, getEnergyDrinkPrice]);

  // Private trainer transaction using wagmi
  const sendPrivateTrainerTx = useCallback(() => {
    sendTransaction(
      {
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        value: 10000000000000000n, // 0.01 ETH in wei (10^16)
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
          console.log("Transaction sent for private trainer! 🎉", hash);
          setTxStatus("Transaction confirmed! 🎉");

          // Find the private trainer item
          const privateTrainerItem = storeItems.find(
            (item) => item.id === "private_trainer"
          );

          if (privateTrainerItem) {
            // Set the pending purchase and show the skill selection modal
            // When the user selects a skill and confirms, handleSkillSelect will call
            // processPurchase to apply the bonus to the player
            setPendingPurchase(privateTrainerItem);
            setShowSkillModal(true);
          }
        },
        onError: (error) => {
          handleError(error);
        },
      }
    );
  }, [sendTransaction]);

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

  if (!isConnected || !address || !player) {
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
                        {item.id === "management_certificate" ? (
                          player.managementCertificate ? (
                            <button
                              disabled
                              className="gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs opacity-50 cursor-not-allowed"
                            >
                              Owned
                            </button>
                          ) : (
                            <button
                              onClick={sendManagementCertificateTx}
                              className="gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs"
                            >
                              0.005 ETH
                            </button>
                          )
                        ) : item.id === "name_change" ? (
                          <button
                            onClick={sendNameChangeTx}
                            className="gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs"
                          >
                            0.001 ETH
                          </button>
                        ) : item.id === "private_trainer" ? (
                          <button
                            onClick={sendPrivateTrainerTx}
                            className="gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs"
                          >
                            0.01 ETH
                          </button>
                        ) : item.id === "leave_of_absence" ? (
                          <button
                            onClick={sendLeaveOfAbsenceTx}
                            className="gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs"
                          >
                            0.001 ETH
                          </button>
                        ) : item.id === "energy_drink" ? (
                          <button
                            onClick={sendEnergyDrinkTx}
                            className="gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs"
                          >
                            {`${Number(getEnergyDrinkPrice()) / 1e18} ETH`}
                          </button>
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
                    {item.id === "leave_of_absence" &&
                      player.leaveOfAbsence &&
                      player.leaveOfAbsence.daysRemaining > 0 && (
                        <div className="mt-1 text-xs text-center text-green-400">
                          {player.leaveOfAbsence.daysRemaining} days remaining
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
      <ConfettiEffect trigger={showConfetti} />

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
