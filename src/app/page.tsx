"use client";

import Image from "next/image";
import { ConnectButton } from "thirdweb/react";
import { client } from "./client";
import { darkTheme } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import sdk, { Context } from "@farcaster/frame-sdk";

export type FrameContext = Context.FrameContext;
export type SafeAreaInsets = Context.SafeAreaInsets;

import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
} from "wagmi";

import { config } from "./components/providers/WagmiProvider";
import { Button } from "@/components/ui/Button";

export default function Demo() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  useEffect(() => {
    const load = async () => {
      setContext(await sdk.context);
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const sendTx = useCallback(() => {
    sendTransaction(
      {
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        data: "0x9846cd9efc000023c0",
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
      }
    );
  }, [sendTransaction]);

  const renderError = (error: Error | null) => {
    if (!error) return null;
    return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
  };

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-[300px] mx-auto py-4 px-2">
      <h1 className="text-2xl font-bold text-center mb-4">Frames v2 Demo</h1>

      {/* Context and actions omitted. */}
      <div className="mb-4">
        <h2 className="font-2xl font-bold">Context</h2>
        <button
          onClick={toggleContext}
          className="flex items-center gap-2 transition-colors"
        >
          <span
            className={`transform transition-transform ${
              isContextOpen ? "rotate-90" : ""
            }`}
          >
            ➤
          </span>
          Tap to expand
        </button>

        {isContextOpen && (
          <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <div>
        <h2 className="font-2xl font-bold">Wallet</h2>

        {address && (
          <div className="my-2 text-xs">
            Address: <pre className="inline">{address}</pre>
            Username:{" "}
            <pre className="inline">{context?.user?.username || "N/A"}</pre>
          </div>
        )}

        <div className="mb-4">
          <Button
            onClick={() =>
              isConnected
                ? disconnect()
                : connect({ connector: config.connectors[0] })
            }
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>

        {isConnected && (
          <>
            <div className="mb-4">
              <Button
                onClick={sendTx}
                disabled={!isConnected || isSendTxPending}
                isLoading={isSendTxPending}
              >
                Send Transaction
              </Button>
              {isSendTxError && renderError(sendTxError)}
              {txHash && (
                <div className="mt-2 text-xs">
                  <div>Hash: {txHash}</div>
                  <div>
                    Status:{" "}
                    {isConfirming
                      ? "Confirming..."
                      : isConfirmed
                      ? "Confirmed!"
                      : "Pending"}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21] flex items-center justify-center">
//       <div className="w-full max-w-md mx-auto p-4 sm:p-6">
//         <div className="glass-container p-6 sm:p-8 rounded-xl sm:rounded-2xl space-y-6 sm:space-y-8">
//           {/* Logo (centered) */}
//           <div className="flex justify-center">
//             <Image
//               src="/logo.png"
//               alt="Logo"
//               width={240}
//               height={240}
//               className="mx-auto"
//               priority
//             />
//           </div>

//           {/* Title */}
//           {/* <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-center">
//             fcc/FC
//           </h1> */}

//           {/* Instructions */}
//           <div className="text-gray-300 text-center text-sm sm:text-base">
//             Connect to your web3 wallet and click on the play button to get
//             started.
//           </div>

//           {/* Connect Button */}
//           <div className="flex justify-center">
//             <ConnectButton
//               client={client}
//               wallets={wallets}
//               theme={darkTheme({
//                 colors: { accentText: "hsl(140, 100%, 26%)" },
//               })}
//               connectModal={{
//                 size: "compact",
//                 showThirdwebBranding: false,
//               }}
//             />
//           </div>

//           {/* PLAY Button */}
//           <button
//             onClick={goToHome}
//             className="w-full gradient-button py-2.5 px-6 rounded-lg text-base transition-all duration-300 active:scale-95 sm:hover:scale-[1.02]"
//           >
//             PLAY
//           </button>
//         </div>
//       </div>
//     </main>
//   );
// }
//           <div className="text-gray-300 text-center text-sm sm:text-base">
//             Connect to your web3 wallet and click on the play button to get
//             started.
//           </div>

//           {/* Connect Button */}
//           <div className="flex justify-center">
//             <ConnectButton
//               client={client}
//               wallets={wallets}
//               theme={darkTheme({
//                 colors: { accentText: "hsl(140, 100%, 26%)" },
//               })}
//               connectModal={{
//                 size: "compact",
//                 showThirdwebBranding: false,
//               }}
//             />
//           </div>

//           {/* PLAY Button */}
//           <button
//             onClick={goToHome}
//             className="w-full gradient-button py-2.5 px-6 rounded-lg text-base transition-all duration-300 active:scale-95 sm:hover:scale-[1.02]"
//           >
//             PLAY
//           </button>
//         </div>
//       </div>
//     </main>
//   );
// }
