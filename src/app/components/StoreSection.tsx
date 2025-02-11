import { PlayerData, StoreItem } from "../lib/store-types";

interface StoreSectionProps {
  title: string;
  items: StoreItem[];
  player: PlayerData;
  processing: string;
  onPurchase: (item: StoreItem) => void;
}

export default function StoreSection({
  title,
  items,
  player,
  processing,
  onPurchase,
}: StoreSectionProps) {
  return (
    <div>
      <h2 className="text-base font-bold text-white mb-2">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass-container p-2 rounded-lg transition-all duration-300 active:bg-[#1a1d21]/50 sm:hover:bg-[#1a1d21]/50"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                <p className="text-xs text-gray-400 truncate">
                  {item.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => onPurchase(item)}
                  disabled={
                    processing === item.id ||
                    player.xp < item.price ||
                    (item.id === "private_trainer" &&
                      (player.privateTrainer?.remainingSessions ?? 0) > 0)
                  }
                  className={`gradient-button px-3 py-2 rounded-lg whitespace-nowrap text-xs ${
                    processing === item.id ||
                    player.xp < item.price ||
                    (item.id === "private_trainer" &&
                      (player.privateTrainer?.remainingSessions ?? 0) > 0)
                      ? "opacity-50 cursor-not-allowed"
                      : "active:scale-95"
                  }`}
                >
                  {processing === item.id ? "..." : `${item.price} XP`}
                </button>
              </div>
            </div>
            {item.id === "private_trainer" && player.privateTrainer && (
              <div className="mt-1 text-xs text-center text-gray-400">
                {player.privateTrainer.remainingSessions} sessions left
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
