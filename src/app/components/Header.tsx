"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface HeaderProps {
  pageName: string;
}

export default function Header({ pageName }: HeaderProps) {
  const router = useRouter();

  const goToSettings = () => {
    router.push("/settings");
  };

  return (
    <header className="relative h-16 bg-[#FFFFF] text-white py-4">
      <h1 className="absolute top-2 left-2 font-bold text-[32px]">
        {pageName}
      </h1>
      <button
        onClick={goToSettings}
        className="absolute top-[2px] right-[2px] bg-transparent flex items-center justify-center w-6 h-6"
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
    </header>
  );
}
