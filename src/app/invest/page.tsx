"use client";

import { useRouter } from "next/navigation";
import Header from "../components/Header"; // Import the Header
import Footer from "../components/Footer";

export default function InvestPage() {
  const router = useRouter();

  return (
    <>
      {/* Pass the pageName prop to the Header */}
      <Header pageName="Invest" />
      <b>COMING SOON</b>
      <Footer />
    </>
  );
}
