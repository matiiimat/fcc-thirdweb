import { useConnect } from "wagmi";
import { config } from "./providers/WagmiProvider";
import { Button } from "@/components/ui/Button";
import Header from "./Header";
import Footer from "./Footer";

interface PageWrapperProps {
  children: React.ReactNode;
  pageName?: string;
}

export function PageWrapper({ children, pageName = "Team" }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName={pageName} />
      <div className="container max-w-md mx-auto px-3 py-4 pb-20">
        <div className="glass-container p-4 text-center rounded-2xl shadow-lg">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function LoadingState({ pageName }: { pageName?: string }) {
  return (
    <PageWrapper pageName={pageName}>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    </PageWrapper>
  );
}

export function NoWalletState({ pageName }: { pageName?: string }) {
  const { connect } = useConnect();

  return (
    <PageWrapper pageName={pageName}>
      <p className="text-gray-400 mb-4">Please connect your wallet</p>
      <Button onClick={() => connect({ connector: config.connectors[0] })}>
        Connect Wallet
      </Button>
    </PageWrapper>
  );
}

interface StatusMessageProps {
  error?: string;
  success?: string;
}

export function StatusMessages({ error, success }: StatusMessageProps) {
  return (
    <>
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500 bg-opacity-20 text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-3 rounded-lg bg-green-500 bg-opacity-20 text-green-300">
          {success}
        </div>
      )}
    </>
  );
}
