"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0d0f12] p-4">
      <div className="flex justify-around items-center flex-wrap gap-2 max-w-screen-lg mx-auto">
        <div className="flex flex-col items-center">
          <button onClick={() => router.push("/home")} className="text-3xl">
            📋
          </button>
          <span className="text-xs mt-1">Player Info</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={() => router.push("/invest")} className="text-3xl">
            📈
          </button>
          <span className="text-xs mt-1">Finances</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={() => router.push("/train")} className="text-3xl">
            👟
          </button>
          <span className="text-xs mt-1">Train</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={() => router.push("/store")} className="text-3xl">
            🛒
          </button>
          <span className="text-xs mt-1">Store</span>
        </div>
        <div className="flex flex-col items-center">
          <button onClick={() => router.push("/team")} className="text-3xl">
            👥
          </button>
          <span className="text-xs mt-1">Team</span>
        </div>
      </div>
    </footer>
  );
}
