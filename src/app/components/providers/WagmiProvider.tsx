import { createConfig, http, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { frameConnector } from "@/app/lib/connector";
import { devConnector, isDevMode } from "@/app/lib/devConnector";

const connectors = isDevMode
  ? [devConnector(), frameConnector()]
  : [frameConnector()];

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors,
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
