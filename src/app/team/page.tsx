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
      <b>COMING SOON</b>
      <Footer />
    </>
  );
}
