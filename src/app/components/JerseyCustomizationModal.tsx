"use client";

import { useState } from "react";
import { IJersey } from "../models/Team";
import Jersey from "./Jersey";

interface JerseyCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jersey: IJersey) => void;
  currentJersey?: IJersey;
  isBottomSheet?: boolean;
}

const PATTERNS = [
  { id: "solid", name: "Solid" },
  { id: "stripes", name: "Stripes" },
  { id: "halves", name: "Halves" },
  { id: "quarters", name: "Quarters" },
];

export default function JerseyCustomizationModal({
  isOpen,
  onClose,
  onSave,
  currentJersey,
  isBottomSheet = false,
}: JerseyCustomizationModalProps) {
  const [jersey, setJersey] = useState<IJersey>(
    currentJersey || {
      primaryColor: "#ffffff",
      secondaryColor: "#000000",
      pattern: "solid",
      sponsorLogoUrl:
        "https://fcc-test.netlify.app/_next/image?url=%2Flogo.png&w=90&q=90", // TODO: DEFAUT URL PATH IMAGE TO CHANGE WHEN LIVE
    }
  );

  if (!isOpen) return null;

  const handleSave = () => {
    // Ensure empty string for sponsorLogoUrl if no value
    const updatedJersey = {
      ...jersey,
      sponsorLogoUrl: jersey.sponsorLogoUrl?.trim() || "",
    };
    onSave(updatedJersey);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          bg-gradient-to-b from-[#1a1d21] to-[#0d0f12] 
          rounded-t-xl w-full max-w-md max-h-[80vh] flex flex-col
          transform transition-all duration-300 ease-out
          ${isBottomSheet ? "animate-slide-up" : "animate-fade-in"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="absolute top-3 right-3">
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Preview at the top */}
        <div className="p-4 border-b border-gray-700">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="w-24 h-32 mx-auto flex items-center justify-center">
              <Jersey jersey={jersey} size="large" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Primary Color
              </label>
              <input
                type="color"
                value={jersey.primaryColor}
                onChange={(e) =>
                  setJersey({ ...jersey, primaryColor: e.target.value })
                }
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Secondary Color
              </label>
              <input
                type="color"
                value={jersey.secondaryColor}
                onChange={(e) =>
                  setJersey({ ...jersey, secondaryColor: e.target.value })
                }
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>

            {/* Pattern Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Pattern
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PATTERNS.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() =>
                      setJersey({
                        ...jersey,
                        pattern: pattern.id as IJersey["pattern"],
                      })
                    }
                    className={`
                      p-1.5 rounded-lg transition-all duration-200 text-sm
                      ${
                        jersey.pattern === pattern.id
                          ? "bg-green-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }
                    `}
                  >
                    {pattern.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sponsorship */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sponsor Logo URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={jersey.sponsorLogoUrl || ""}
                onChange={(e) =>
                  setJersey({ ...jersey, sponsorLogoUrl: e.target.value })
                }
                className="w-full px-2 py-1.5 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">
                Enter sponsor&apos;s logo URL (90x90 recommended)
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
