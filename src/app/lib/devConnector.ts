import { getAddress, numberToHex } from "viem";
import { createConnector } from "wagmi";
import { base } from "wagmi/chains";

const DEV_ADDRESS = process.env.NEXT_PUBLIC_DEV_WALLET_ADDRESS as `0x${string}` | undefined;

devConnector.type = "devConnector" as const;

export function devConnector() {
  return createConnector((config) => ({
    id: "dev-wallet",
    name: "Dev Wallet",
    type: devConnector.type,

    async setup() {},
    async connect() {
      if (!DEV_ADDRESS) throw new Error("NEXT_PUBLIC_DEV_WALLET_ADDRESS not set");
      return {
        accounts: [getAddress(DEV_ADDRESS)],
        chainId: base.id,
      };
    },
    async disconnect() {},
    async getAccounts() {
      if (!DEV_ADDRESS) throw new Error("NEXT_PUBLIC_DEV_WALLET_ADDRESS not set");
      return [getAddress(DEV_ADDRESS)];
    },
    async getChainId() {
      return base.id;
    },
    async isAuthorized() {
      return !!DEV_ADDRESS;
    },
    async switchChain({ chainId }) {
      const chain = config.chains.find((c) => c.id === chainId);
      if (!chain) throw new Error("Chain not configured");
      return chain;
    },
    onAccountsChanged() {},
    onChainChanged() {},
    async onDisconnect() {},
    async getProvider() {
      return undefined as any;
    },
  }));
}

export const isDevMode =
  process.env.NODE_ENV === "development" && !!DEV_ADDRESS;
