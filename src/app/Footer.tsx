"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  // If you want to hide the footer on home ("/"), uncomment this block:
  // if (pathname === "/") {
  //   return null;
  // }

  return (
    <footer className="fixed bottom-0 left-0 right-0 flex justify-around items-center bg-zinc-800 p-4 text-2xl">
      <button onClick={() => router.push("/train")}>👟</button>
      <button>🛒</button>
      <button>👥</button>
      <button>🏆</button>
    </footer>
  );
}
