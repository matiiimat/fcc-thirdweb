"use client";

import Image from "next/image";
import Header from "../components/Header";
import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
import { useRouter } from "next/navigation";
import { inAppWallet, createWallet } from "thirdweb/wallets";

const wallets = [
  inAppWallet({
    auth: {
      options: ["farcaster"],
    },
  }),
  createWallet("com.coinbase.wallet"),
];

export default function CreatePlayer() {
  return (
    <>
      {/* Header */}
      <Header pageName="Create Player" />
    </>
  );
}
