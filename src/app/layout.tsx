import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Header from "./components/Header";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "fcc/FC",
  description: "Online football management game on the Farcaster",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "fcc/FC",
  },
  formatDetection: {
    telephone: false,
  },
};

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
            imageUrl: "https://fcc-test.netlify.app/logo.pngg",
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
        {/* Content layer */}
        <div className="relative z-20">
          <ThirdwebProvider>{children}</ThirdwebProvider>
        </div>
      </body>
    </html>
  );
}
