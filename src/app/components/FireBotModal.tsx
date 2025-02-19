import { Dialog } from "@headlessui/react";

interface FireBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  botName: string;
}

export default function FireBotModal({
  isOpen,
  onClose,
  onConfirm,
  botName,
}: FireBotModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-[#1a1d21] p-6">
          <Dialog.Title className="text-lg font-medium text-white mb-4">
            Fire Bot
          </Dialog.Title>
          <p className="text-gray-300 mb-6">
            Are you sure you want to fire {botName} from your team?
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
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Fire
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
