import { useState } from "react";
import { SkillOption } from "../lib/store-types";
import { skillOptions } from "../lib/store-constants";

interface SkillSelectionModalProps {
  onClose: () => void;
  onConfirm: (skill: string) => void;
  processing: boolean;
}

export default function SkillSelectionModal({
  onClose,
  onConfirm,
  processing,
}: SkillSelectionModalProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-container p-3 w-full max-h-[80vh] sm:max-w-md rounded-t-xl sm:rounded-xl shadow-lg overflow-y-auto">
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
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 active:bg-gray-700 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedSkill && onConfirm(selectedSkill)}
            disabled={!selectedSkill || processing}
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
  );
}
