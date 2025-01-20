import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Header from "./Header"; // <-- Import the new Header
import Footer from "./Footer"; // <-- Import the existing Footer

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Farcaster FC",
  description: "Online football management game on the Farcaster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
          {/* The Header goes on top */}
          <Header />

          {/* Page content */}
          {children}

          {/* The Footer goes on bottom here */}
          <Footer />
        </ThirdwebProvider>
      </body>
    </html>
  );
}
