"use client";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

import { Providers } from "./providers";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "fcc/FC",
  description: "A Farcaster Frames v2 frame for fcc/FC",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export function InitializeApp() {
  useEffect(() => {
    // Call the init route to create database indexes
    fetch("/api/init")
      .then((response) => response.json())
      .catch((error) => console.error("Error initializing app:", error));
  }, []);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="fcc/FC" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="fcc/FC" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta
          property="fc:frame"
          content={JSON.stringify({
            version: "next",
            imageUrl: "https://fcc-test.netlify.app/logo.png",
            button: {
              title: "fccFC",
              action: {
                type: "launch_frame",
                name: "Play fccFC",
                url: "https://fcc-test.netlify.app",
                splashImageUrl: "https://fcc-test.netlify.app/logo.png",
                splashBackgroundColor: "#08090a",
              },
            },
          })}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <InitializeApp />
          {children}
        </Providers>
      </body>
    </html>
  );
}
