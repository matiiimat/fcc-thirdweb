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

  const buttonClass =
    "relative flex items-center justify-center w-10 h-10 rounded-xl bg-ink/80 border border-pitch-line/25 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.05),inset_2px_2px_5px_rgba(0,0,0,0.55)] hover:border-pitch-line/50 hover:scale-105 transition-all duration-300";

  return (
    <header className="relative h-16 py-4">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-pitch-line/60 to-transparent" />
      <h1 className="absolute top-2 left-3 font-display tracking-broadcast uppercase text-chalk text-[28px] leading-none">
        {pageName}
      </h1>
      <div className="absolute top-[10px] right-[10px] flex gap-3">
        {onMailboxClick && (
          <button
            onClick={onMailboxClick}
            className={buttonClass}
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
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blood border border-ink" />
            )}
          </button>
        )}
        <button
          onClick={goToStore}
          className={buttonClass}
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
