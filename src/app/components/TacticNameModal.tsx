"use client";

import { useEffect, useRef, useState } from "react";

interface TacticNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  existingNames: string[];
}

const TacticNameModal: React.FC<TacticNameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingNames,
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a tactic name");
      return;
    }

    if (existingNames.includes(name.trim())) {
      setError("A tactic with this name already exists");
      return;
    }

    onSave(name.trim());
    setName("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-[#1a1d21] rounded-xl p-4 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-bold text-white mb-4">Save Tactic</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="tacticName"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Tactic Name
            </label>
            <input
              ref={inputRef}
              id="tacticName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 bg-gray-800 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Enter tactic name"
            />
            {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TacticNameModal;
