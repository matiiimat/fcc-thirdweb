"use client";

import { useState } from "react";
import { Position } from "../models/Player";
import Image from "next/image";

interface PlayerPosition {
  ethAddress: string;
  position: Position;
  x: number;
  y: number;
}

interface FormationDisplayProps {
  formation: string;
  playerPositions: PlayerPosition[];
  onPositionClick: (x: number, y: number, position: Position) => void;
  availablePlayers: {
    ethAddress: string;
    playerName: string;
    username?: string;
  }[];
}

const FormationDisplay: React.FC<FormationDisplayProps> = ({
  formation,
  playerPositions,
  onPositionClick,
  availablePlayers,
}) => {
  const [hoveredPosition, setHoveredPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const getFormationPositions = (
    formation: string
  ): { x: number; y: number; position: Position }[] => {
    const [defenders, midfielders, forwards] = formation.split("-").map(Number);
    const positions: { x: number; y: number; position: Position }[] = [];

    // Add goalkeeper
    positions.push({ x: 50, y: 90, position: "GK" });

    // Add defenders
    const defenderSpacing = 80 / (defenders + 1);
    for (let i = 1; i <= defenders; i++) {
      positions.push({
        x: i * defenderSpacing + 10,
        y: 75,
        position: "D",
      });
    }

    // Add midfielders
    const midfielderSpacing = 80 / (midfielders + 1);
    for (let i = 1; i <= midfielders; i++) {
      positions.push({
        x: i * midfielderSpacing + 10,
        y: 50,
        position: "M",
      });
    }

    // Add forwards
    const forwardSpacing = 80 / (forwards + 1);
    for (let i = 1; i <= forwards; i++) {
      positions.push({
        x: i * forwardSpacing + 10,
        y: 25,
        position: "F",
      });
    }

    return positions;
  };

  const formationPositions = getFormationPositions(formation);

  return (
    <div className="relative w-full h-full">
      {/* Soccer field background */}
      <Image
        src="/images/pitch.png"
        alt="Soccer field"
        fill
        className="object-cover"
        priority
      />

      {/* Player positions */}
      {formationPositions.map((pos, index) => {
        const player = playerPositions.find(
          (p) => p.x === pos.x && p.y === pos.y
        );
        const isHovered =
          hoveredPosition?.x === pos.x && hoveredPosition?.y === pos.y;

        return (
          <div
            key={index}
            className={`absolute w-12 h-12 -ml-6 -mt-6 cursor-pointer transition-transform duration-200 ${
              isHovered ? "scale-110" : ""
            }`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            onClick={() => onPositionClick(pos.x, pos.y, pos.position)}
            onMouseEnter={() => setHoveredPosition(pos)}
            onMouseLeave={() => setHoveredPosition(null)}
          >
            <div
              className={`
                w-full h-full rounded-full border-2
                ${
                  player
                    ? "bg-green-600 border-green-400"
                    : "bg-gray-800/80 border-gray-600 hover:bg-gray-700/80"
                }
                flex items-center justify-center text-white font-bold text-sm
              `}
            >
              {player ? (
                <div className="text-center">
                  <div className="text-xs">
                    {(() => {
                      const foundPlayer = availablePlayers.find(
                        (p) => p.ethAddress === player.ethAddress
                      );
                      const displayName =
                        foundPlayer?.username || foundPlayer?.playerName;
                      return displayName?.slice(0, 6) || "...";
                    })()}
                  </div>
                  <div className="text-[10px] opacity-75">{pos.position}</div>
                </div>
              ) : (
                pos.position
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormationDisplay;
