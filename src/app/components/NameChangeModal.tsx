"use client";

import { useState } from "react";

interface NameChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  processing: boolean;
}

export default function NameChangeModal({
  isOpen,
  onClose,
  onConfirm,
  processing,
}: NameChangeModalProps) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    // Validate name
    if (newName.length < 4) {
      setError("Name must be at least 4 characters long");
      return;
    }
    if (newName.length > 24) {
      setError("Name must be less than 24 characters long");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(newName)) {
      setError("Name can only contain letters and spaces");
      return;
    }

    onConfirm(newName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="glass-container p-3 w-[90%] max-h-[80vh] sm:max-w-md rounded-xl shadow-lg">
        <h2 className="text-base font-bold text-white mb-2">
          Change Player Name
        </h2>
        <div className="mb-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setError("");
            }}
            placeholder="Enter new name"
            className="w-full px-3 py-2 rounded-lg bg-[#1a1d21] text-white border border-gray-700 focus:border-green-500 focus:outline-none"
            maxLength={24}
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 active:bg-gray-700 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || !newName}
            className={`flex-1 gradient-button px-4 py-2 rounded-lg text-sm ${
              processing || !newName
                ? "opacity-50 cursor-not-allowed"
                : "active:scale-95"
            }`}
          >
            {processing ? "..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
