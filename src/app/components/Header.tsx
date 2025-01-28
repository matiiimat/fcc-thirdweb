"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
  pageName: string;
}

export default function Header({ pageName }: HeaderProps) {
  const router = useRouter();

  // Define the function *above* where you use it
  const goToSettings = () => {
    router.push("/settings");
  };

  return (
    <header className="relative h-16 bg-[#25121B] text-white py-4">
      <h1 className="absolute top-2 left-2 font-bold text-[32px]">
        {pageName}
      </h1>
      <button
        onClick={goToSettings}
        className="absolute top-2 right-2 bg-transparent text-white text-xl"
        aria-label="Settings"
      >
        ⚙️
      </button>
    </header>
  );
}
