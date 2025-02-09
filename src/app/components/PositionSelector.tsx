"use client";

import { Position } from "../models/Player";
import { useState } from "react";

interface PositionSelectorProps {
  onSelect: (position: Position) => void;
  selectedPosition: Position | null;
  disabled?: boolean;
}

const PositionSelector: React.FC<PositionSelectorProps> = ({
  onSelect,
  selectedPosition,
  disabled = false,
}) => {
  const positions: { value: Position; label: string; description: string }[] = [
    { value: "D", label: "Defender", description: "Protect the goal" },
    { value: "M", label: "Midfielder", description: "Control the game" },
    { value: "F", label: "Forward", description: "Score goals" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-white mb-3">Select Position</h3>
      <div className="grid grid-cols-1 gap-3">
        {positions.map(({ value, label, description }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            disabled={disabled}
            className={`
              p-4 rounded-xl transition-all duration-300
              ${
                selectedPosition === value
                  ? "bg-green-600 text-white"
                  : "glass-container hover:bg-gray-800"
              }
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.02]"
              }
            `}
          >
            <div className="text-lg font-bold mb-1">{value}</div>
            <div className="text-sm font-medium">{label}</div>
            <div className="text-xs text-gray-400 mt-1">{description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PositionSelector;
