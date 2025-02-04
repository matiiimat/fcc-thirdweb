"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0d0f12] p-4">
      <div className="flex justify-around items-center flex-wrap gap-2 max-w-screen-lg mx-auto">
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/home")}
            className="flex items-center justify-center w-6 h-6 mb-[1px]"
          >
            <Image
              src="/icons/player-icon.png"
              alt="Player"
              width={24}
              height={24}
              priority
            />
          </button>
          <span className="text-xs">Player</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/invest")}
            className="flex items-center justify-center w-6 h-6 mb-[1px]"
          >
            <Image
              src="/icons/finances-icon.png"
              alt="Finances"
              width={24}
              height={24}
              priority
            />
          </button>
          <span className="text-xs">Finances</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/train")}
            className="flex items-center justify-center w-6 h-6 mb-[1px]"
          >
            <Image
              src="/icons/train-icon.png"
              alt="Train"
              width={24}
              height={24}
              priority
            />
          </button>
          <span className="text-xs">Train</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/store")}
            className="flex items-center justify-center w-6 h-6 mb-[1px]"
          >
            <Image
              src="/icons/store-icon.png"
              alt="Store"
              width={24}
              height={24}
              priority
            />
          </button>
          <span className="text-xs">Store</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/team")}
            className="flex items-center justify-center w-6 h-6 mb-[1px]"
          >
            <Image
              src="/icons/team-icon.png"
              alt="Team"
              width={24}
              height={24}
              priority
            />
          </button>
          <span className="text-xs">Team</span>
        </div>
      </div>
    </footer>
  );
}
