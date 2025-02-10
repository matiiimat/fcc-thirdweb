"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface HeaderProps {
  pageName: string;
  xp?: number;
}

export default function Header({ pageName, xp = 0 }: HeaderProps) {
  const router = useRouter();

  const goToSettings = () => {
    router.push("/settings");
  };

  const goToLeaderboard = () => {
    router.push("/leaderboard");
  };

  return (
    <header className="relative h-16 bg-[#FFFFF] text-white py-4">
      <h1 className="absolute top-2 left-2 font-bold text-[32px]">
        {pageName}
      </h1>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
        <Image
          src="/icons/xp-icon.png"
          alt="XP"
          width={16}
          height={16}
          priority
        />
        <span className="text-lg font-semibold">{xp.toLocaleString()}</span>
      </div>
      <div className="absolute top-[10px] right-[10px] flex gap-4">
        <button
          onClick={goToLeaderboard}
          className="bg-[#0d0f12]/90 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.07),inset_2px_2px_5px_rgba(0,0,0,0.5)] hover:shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.1),inset_1px_1px_3px_rgba(0,0,0,0.4)] flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105"
          aria-label="Leaderboard"
        >
          <Image
            src="/icons/leaderboard-icon.png"
            alt="Leaderboard"
            width={24}
            height={24}
            priority
          />
        </button>
        <button
          onClick={goToSettings}
          className="bg-[#0d0f12]/90 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.07),inset_2px_2px_5px_rgba(0,0,0,0.5)] hover:shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.1),inset_1px_1px_3px_rgba(0,0,0,0.4)] flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105"
          aria-label="Settings"
        >
          <Image
            src="/icons/settings-icon.png"
            alt="Settings"
            width={24}
            height={24}
            priority
          />
        </button>
      </div>
    </header>
  );
}
