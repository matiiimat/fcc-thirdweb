"use client";

import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TeamPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Team" xp={0} />
      <div className="container max-w-md mx-auto px-6 py-6 pb-20">
        <div className="glass-container p-8 text-center rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text">
            Team
          </h2>
          <p className="text-gray-300 text-lg">COMING SOON</p>
          <div className="mt-6 w-16 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full opacity-50"></div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
