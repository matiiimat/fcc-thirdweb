"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface HeaderProps {
  pageName: string;
  onMailboxClick?: () => void;
  hasNotifications?: boolean;
}

export default function Header({ pageName, onMailboxClick, hasNotifications }: HeaderProps) {
  const router = useRouter();

  const goToStore = () => {
    router.push("/storev1");
  };

  return (
    <header className="relative h-16 bg-[#FFFFF] text-white py-4">
      <h1 className="absolute top-2 left-2 font-bold text-[32px]">
        {pageName}
      </h1>
      <div className="absolute top-[10px] right-[10px] flex gap-4">
        {onMailboxClick && (
          <button
            onClick={onMailboxClick}
            className="relative bg-[#0d0f12]/90 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.07),inset_2px_2px_5px_rgba(0,0,0,0.5)] hover:shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.1),inset_1px_1px_3px_rgba(0,0,0,0.4)] flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105"
            aria-label="Notifications"
          >
            <Image
              src="/icons/mail-icon.png"
              alt="Mail"
              width={24}
              height={24}
              priority
            />
            {hasNotifications && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-[#0d0f12]"></div>
            )}
          </button>
        )}
        <button
          onClick={goToStore}
          className="bg-[#0d0f12]/90 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.07),inset_2px_2px_5px_rgba(0,0,0,0.5)] hover:shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.1),inset_1px_1px_3px_rgba(0,0,0,0.4)] flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105"
          aria-label="Store"
        >
          <Image
            src="/icons/store-icon.png"
            alt="Store"
            width={24}
            height={24}
            priority
          />
        </button>
      </div>
    </header>
  );
}
