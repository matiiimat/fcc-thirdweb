"use client";

import Image from "next/image";
import Header from "../components/Header";
import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { client } from "../client";
import { useRouter } from "next/navigation";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import Footer from "../components/Footer";

const wallets = [
  inAppWallet({
    auth: {
      options: ["farcaster"],
    },
  }),
  createWallet("com.coinbase.wallet"),
];

export default function HomePage() {
  const wallet = useActiveWallet()?.getAccount();

  return (
    <>
      {/* Header */}
      <Header pageName="Home" />

      {/* Image centered at 75% width */}
      <div className="flex justify-center mt-4">
        <Image
          src="/assets/home.png"
          alt="Home"
          width={0}
          height={0}
          sizes="100vw"
          className="w-3/4 h-auto"
          priority
        />
      </div>

      {/* Player section, just below the image */}
      <div className="flex flex-col items-center mt-4">
        {/* TODO: update to player's name instead of "PLAYER" / ADDRESS / RANDOMLY DONE GAME ACCORDING TO ADDRESS */}
        <h2 className="text-center text-[26px]">PLAYER</h2>
        {/* Stats */}
        <div className="flex flex-col items-start space-y-2 mt-4">
          <div>
            <span className="font-semibold">OVERALL: </span>
            {/* Replace 99 with your real variable */}
            <span>99</span>
          </div>
          <div>
            <span className="font-semibold">LAST GAME: </span>
            {/* Replace 3 with your real variable */}
            <span>3</span>
          </div>
          <div>
            <span className="font-semibold">TRAINING BONUS: </span>
            {/* Replace 5 with your real variable */}
            <span>5</span>
          </div>
          <div>
            <span className="font-semibold">CAPITAL: </span>
            {/* Replace 1000 with your real variable */}
            <span>1000</span>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
