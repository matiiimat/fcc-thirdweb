"use client";

import { useEffect, useRef, useState } from "react";
import { calculatePlayerRating, getStarRating } from "../lib/game";
import { Position } from "../models/Player";

interface Player {
  ethAddress: string;
  playerName: string;
  isBot?: boolean;
  stats?: {
    strength: number;
    stamina: number;
    passing: number;
    shooting: number;
    defending: number;
    speed: number;
    positioning: number;
    workEthic: number;
  };
}

const getPositionName = (pos: string): string => {
  switch (pos) {
    case "D":
      return "DEFENDER";
    case "M":
      return "MIDFIELDER";
    case "F":
      return "FORWARD";
    default:
      return pos;
  }
};

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSelect: (player: Player) => void;
  selectedPlayer?: Player;
  position: Position;
  assignedPlayers: string[];
  context?: any;
}

export default function PlayerSelectionModal({
  isOpen,
  onClose,
  players,
  onSelect,
  selectedPlayer,
  position,
  assignedPlayers,
  context,
}: PlayerSelectionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div
          ref={modalRef}
          className="bg-[#1a1d21] rounded-xl p-4 w-full max-w-md mx-4"
        >
          <h3 className="text-lg font-bold text-white mb-2">
            Select Player for {getPositionName(position)} Position
          </h3>
          <div className="max-h-[60vh] overflow-y-auto">
            {players.filter(
              (p) =>
                !assignedPlayers.includes(p.ethAddress) ||
                selectedPlayer?.ethAddress === p.ethAddress
            ).length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No available players
              </p>
            ) : (
              <div className="space-y-2">
                {players
                  .filter(
                    (p) =>
                      !assignedPlayers.includes(p.ethAddress) ||
                      selectedPlayer?.ethAddress === p.ethAddress
                  )
                  .map((player) => (
                    <button
                      key={player.ethAddress}
                      onClick={() => {
                        onSelect(player);
                        onClose();
                      }}
                      className={`
                        w-full p-3 rounded-lg text-left transition-all duration-200
                        ${
                          selectedPlayer?.ethAddress === player.ethAddress
                            ? "bg-green-600 text-white"
                            : "glass-container hover:bg-gray-800"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {player.isBot
                            ? player.playerName
                            : context?.user?.username || player.playerName}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-[0.7rem] leading-none">
                            {player.stats
                              ? getStarRating(
                                  calculatePlayerRating(player.stats)
                                )
                              : "⭐"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
