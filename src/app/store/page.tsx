"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Store() {
  return (
    <div className="min-h-screen bg-[#0d0f12] text-white">
      <Header pageName="Store" />
      <main className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-2xl font-bold">Coming soon</h2>
      </main>
      <Footer />
    </div>
  );
}
