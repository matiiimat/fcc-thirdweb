"use client";

import { useRouter } from "next/navigation";
import Header from "../components/Header"; // Import the Header
import Footer from "../components/Footer";

export default function TeamPage() {
  const router = useRouter();

  return (
    <>
      {/* Pass the pageName prop to the Header */}
      <Header pageName="Team" />
      <div className="flex flex-col items-center justify-center min-h-[60vh] pb-20">
        <b>COMING SOON</b>
      </div>
      <Footer />
    </>
  );
}
