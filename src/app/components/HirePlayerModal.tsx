import { Dialog } from "@headlessui/react";

interface HirePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  playerName: string;
  username?: string;
}

export default function HirePlayerModal({
  isOpen,
  onClose,
  onConfirm,
  playerName,
  username,
}: HirePlayerModalProps) {
  // Use username if available, otherwise fall back to playerName
  const displayName =
    username && username.trim() !== "" ? username : playerName;
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-[#1a1d21] p-6">
          <Dialog.Title className="text-lg font-medium text-white mb-4">
            Invite Player
          </Dialog.Title>
          <p className="text-gray-300 mb-6">
            Send a team invitation to {displayName}? They will need to accept
            the invitation to join your team.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Send Invitation
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
