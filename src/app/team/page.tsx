"use client";

import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TeamPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <Header pageName="Team" />
      <div className="container max-w-md mx-auto px-4 py-6">
        <div className="glass-container p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Team</h2>
          <p className="text-gray-300">COMING SOON</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
