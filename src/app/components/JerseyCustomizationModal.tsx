"use client";

import { useState } from "react";
import { IJersey } from "../models/Team";

interface JerseyCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jersey: IJersey) => void;
  currentJersey?: IJersey;
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
}: JerseyCustomizationModalProps) {
  const [jersey, setJersey] = useState<IJersey>(
    currentJersey || {
      primaryColor: "#ffffff",
      secondaryColor: "#000000",
      pattern: "solid",
      sponsorLogoUrl: "",
    }
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(jersey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Jersey Customization
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4">
            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Color
              </label>
              <input
                type="color"
                value={jersey.primaryColor}
                onChange={(e) =>
                  setJersey({ ...jersey, primaryColor: e.target.value })
                }
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secondary Color
              </label>
              <input
                type="color"
                value={jersey.secondaryColor}
                onChange={(e) =>
                  setJersey({ ...jersey, secondaryColor: e.target.value })
                }
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            {/* Pattern Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      p-2 rounded-lg transition-all duration-200
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sponsor Logo URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={jersey.sponsorLogoUrl || ""}
                onChange={(e) =>
                  setJersey({ ...jersey, sponsorLogoUrl: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Enter the URL of your sponsor's logo image
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-900 rounded-lg">
              <div className="w-32 h-40 mx-auto relative">
                {/* Jersey SVG with dynamic colors and patterns */}
                <svg viewBox="0 0 100 120" className="w-full h-full">
                  <defs>
                    {jersey.pattern === "stripes" && (
                      <pattern
                        id="stripes"
                        patternUnits="userSpaceOnUse"
                        width="20"
                        height="20"
                        patternTransform="rotate(0)"
                      >
                        <rect
                          width="10"
                          height="20"
                          fill={jersey.primaryColor}
                        />
                        <rect
                          x="10"
                          width="10"
                          height="20"
                          fill={jersey.secondaryColor}
                        />
                      </pattern>
                    )}
                    {jersey.pattern === "halves" && (
                      <linearGradient
                        id="halves"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="50%"
                          style={{ stopColor: jersey.primaryColor }}
                        />
                        <stop
                          offset="50%"
                          style={{ stopColor: jersey.secondaryColor }}
                        />
                      </linearGradient>
                    )}
                    {jersey.pattern === "quarters" && (
                      <pattern
                        id="quarters"
                        patternUnits="userSpaceOnUse"
                        width="100"
                        height="120"
                      >
                        <rect
                          width="50"
                          height="60"
                          fill={jersey.primaryColor}
                        />
                        <rect
                          x="50"
                          width="50"
                          height="60"
                          fill={jersey.secondaryColor}
                        />
                        <rect
                          y="60"
                          width="50"
                          height="60"
                          fill={jersey.secondaryColor}
                        />
                        <rect
                          x="50"
                          y="60"
                          width="50"
                          height="60"
                          fill={jersey.primaryColor}
                        />
                      </pattern>
                    )}
                    {jersey.sponsorLogoUrl && (
                      <pattern
                        id="sponsorLogo"
                        patternUnits="objectBoundingBox"
                        width="1"
                        height="1"
                      >
                        <image
                          href={jersey.sponsorLogoUrl}
                          width="30"
                          height="30"
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </pattern>
                    )}
                  </defs>

                  {/* Jersey shape */}
                  <path
                    d="M20,0 h60 a10,10 0 0 1 10,10 v80 a20,20 0 0 1 -20,20 h-40 a20,20 0 0 1 -20,-20 v-80 a10,10 0 0 1 10,-10"
                    fill={
                      jersey.pattern === "solid"
                        ? jersey.primaryColor
                        : jersey.pattern === "stripes"
                        ? "url(#stripes)"
                        : jersey.pattern === "halves"
                        ? "url(#halves)"
                        : "url(#quarters)"
                    }
                    stroke="#000"
                    strokeWidth="2"
                  />

                  {/* Collar */}
                  <path d="M40,0 v10 h20 v-10" fill="#000" />

                  {/* Logo placeholder */}
                  <circle
                    cx="50"
                    cy="40"
                    r="15"
                    fill={jersey.sponsorLogoUrl ? "url(#sponsorLogo)" : "#666"}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-700 mt-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
