"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getButtonClass = (path: string) => {
    const baseClass =
      "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300";
    const neuClass =
      "bg-[#0d0f12]/90 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.07),inset_2px_2px_5px_rgba(0,0,0,0.5)]";
    const activeClass =
      "bg-gradient-to-br from-[#1a1d21]/95 to-[#0d0f12]/95 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.12),inset_2px_2px_5px_rgba(0,0,0,0.3)]";

    return `${baseClass} ${
      isActive(path) ? activeClass : neuClass
    } hover:scale-105 hover:shadow-lg`;
  };

  const getTextClass = (path: string) => {
    return `text-xs font-medium mt-1 transition-colors duration-300 ${
      isActive(path) ? "text-green-400" : "text-gray-400"
    } hover:text-gray-300`;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0d0f12]/85 backdrop-blur-md px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex justify-around items-center max-w-screen-lg mx-auto">
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/home")}
            className={getButtonClass("/home")}
          >
            <Image
              src="/icons/player-icon.png"
              alt="Player"
              width={20}
              height={20}
              priority
              className="transition-transform group-hover:scale-110"
            />
          </button>
          <span className={getTextClass("/home")}>Player</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/invest")}
            className={getButtonClass("/invest")}
          >
            <Image
              src="/icons/finances-icon.png"
              alt="Finances"
              width={20}
              height={20}
              priority
              className="transition-transform group-hover:scale-110"
            />
          </button>
          <span className={getTextClass("/invest")}>Finances</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/train")}
            className={getButtonClass("/train")}
          >
            <Image
              src="/icons/train-icon.png"
              alt="Train"
              width={20}
              height={20}
              priority
              className="transition-transform group-hover:scale-110"
            />
          </button>
          <span className={getTextClass("/train")}>Train</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/store")}
            className={getButtonClass("/store")}
          >
            <Image
              src="/icons/store-icon.png"
              alt="Store"
              width={20}
              height={20}
              priority
              className="transition-transform group-hover:scale-110"
            />
          </button>
          <span className={getTextClass("/store")}>Store</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/team")}
            className={getButtonClass("/team")}
          >
            <Image
              src="/icons/team-icon.png"
              alt="Team"
              width={20}
              height={20}
              priority
              className="transition-transform group-hover:scale-110"
            />
          </button>
          <span className={getTextClass("/team")}>Team</span>
        </div>
      </div>
    </footer>
  );
}
