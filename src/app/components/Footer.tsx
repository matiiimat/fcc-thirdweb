"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import sdk, { Context } from "@farcaster/frame-sdk";

export type FrameContext = Context.FrameContext;

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();
  const [username, setUsername] = useState("Player");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Farcaster Frame Integration
  useEffect(() => {
    const load = async () => {
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        
        // Store username and profile image in state
        if (ctx?.user?.username) {
          setUsername(ctx.user.username);
        }
        
        if (ctx?.user?.pfpUrl) {
          setProfileImage(ctx.user.pfpUrl);
        }
        
        sdk.actions.ready();
      } catch (error) {
        console.error(
          "Error initializing Farcaster Frame SDK in Footer:",
          error
        );
      }
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getButtonClass = (path: string) => {
    const baseClass =
      "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300";
    const neuClass =
      "bg-[#0d0f12]/90 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.07),inset_2px_2px_5px_rgba(0,0,0,0.5)]";
    const activeClass =
      "bg-gradient-to-br from-[#1a1d21]/95 to-[#0d0f12]/95 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.12),inset_2px_2px_5px_rgba(0,0,0,0.3)]";

    return `${baseClass} ${
      isActive(path) ? activeClass : neuClass
    } hover:scale-105 hover:shadow-lg`;
  };

  const getTextClass = (path: string) => {
    return `text-xs font-medium mt-1 transition-colors duration-300 ${
      isActive(path) ? "text-green-400" : "text-gray-400"
    } hover:text-gray-300`;
  };

  // Haptic feedback function
  const triggerHapticFeedback = async () => {
    try {
      const capabilities = await sdk.getCapabilities();
      // Check if specific haptic methods are supported
      if (capabilities.includes('haptics.impactOccurred')) {
        await sdk.haptics.impactOccurred('medium');
      }
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  };

  // Enhanced navigation function with haptic feedback
  const navigateWithHaptic = async (path: string) => {
    await triggerHapticFeedback();
    router.push(path);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0d0f12]/85 backdrop-blur-md px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex justify-around items-center max-w-screen-lg mx-auto">
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push("/")}
            className={getButtonClass("/")}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-5 h-5 rounded-full object-cover"
                width={20}
                height={20}
              />
            ) : (
              <Image
                src="/icons/player-icon.png"
                alt="Player"
                width={20}
                height={20}
                priority
                className="transition-transform group-hover:scale-110"
              />
            )}
          </button>
          <span className={getTextClass("/")}>
            {username}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => navigateWithHaptic("/train")}
            className={getButtonClass("/train")}
          >
            <Image
              src="/icons/solomatch-icon.png"
              alt="Train"
              width={20}
              height={20}
              priority
              className="transition-transform group-hover:scale-110"
            />
          </button>
          <span className={getTextClass("/train")}>Train</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => navigateWithHaptic("/team")}
            className={getButtonClass("/team")}
          >
            <Image
              src="/icons/team-icon.png"
              alt="Team"
              width={20}
              height={20}
              priority
              className="transition-transform group-hover:scale-110"
            />
          </button>
          <span className={getTextClass("/team")}>Team</span>
        </div>
        <div className="flex flex-col items-center">
          <button
            onClick={() => navigateWithHaptic("/league")}
            className={getButtonClass("/league")}
          >
            <Image
              src="/icons/leaderboard-icon.png"
              alt="League"
              width={20}
              height={20}
              priority
              className="transition-transform group-hover:scale-110"
            />
          </button>
          <span className={getTextClass("/league")}>League</span>
        </div>
      </div>
    </footer>
  );
}
