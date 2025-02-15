"use client";

import { Position } from "../models/Player";
import { useState } from "react";

interface PositionSelectorProps {
  onSelect: (position: Position) => void;
  selectedPosition: Position | null;
  disabled?: boolean;
  compact?: boolean;
}

const PositionSelector: React.FC<PositionSelectorProps> = ({
  onSelect,
  selectedPosition,
  disabled = false,
  compact = false,
}) => {
  const positions: { value: Position; label: string }[] = [
    { value: "D", label: "DEF" },
    { value: "M", label: "MID" },
    { value: "F", label: "FWD" },
  ];

  return (
    <div>
      <h3
        className={`${
          compact ? "text-xs" : "text-sm sm:text-base"
        } font-medium text-white mb-1 sm:mb-2`}
      >
        Select Position
      </h3>
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {positions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSelect(value)}
            disabled={disabled}
            className={`
              ${
                compact ? "p-1" : "p-2"
              } rounded-lg transition-all duration-300 text-center
              ${
                selectedPosition === value
                  ? "bg-green-600 text-white"
                  : "glass-container active:bg-gray-800 sm:hover:bg-gray-800"
              }
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "active:scale-95 sm:hover:scale-[1.02]"
              }
            `}
          >
            <div
              className={`${
                compact ? "text-sm" : "text-base sm:text-lg"
              } font-bold`}
            >
              {value}
            </div>
            <div
              className={`${
                compact ? "text-[10px]" : "text-xs"
              } uppercase tracking-tight`}
            >
              {label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PositionSelector;
