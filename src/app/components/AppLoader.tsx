"use client";

import { useEffect, useState } from "react";

interface AppLoaderProps {
  message?: string;
  showProgress?: boolean;
}

export default function AppLoader({ 
  message = "Initializing...", 
  showProgress = true 
}: AppLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    if (!showProgress) return;

    const messages = [
      "Connecting to Farcaster...",
      "Loading your profile...",
      "Preparing the game...",
      "Almost ready!"
    ];

    let messageIndex = 0;
    let progressValue = 0;

    const interval = setInterval(() => {
      progressValue += Math.random() * 15 + 5; // Random increment between 5-20
      
      if (progressValue >= 100) {
        progressValue = 100;
        setCurrentMessage("Ready!");
        clearInterval(interval);
      } else if (progressValue > messageIndex * 25 && messageIndex < messages.length) {
        setCurrentMessage(messages[messageIndex]);
        messageIndex++;
      }
      
      setProgress(Math.min(progressValue, 100));
    }, 200);

    return () => clearInterval(interval);
  }, [showProgress]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          {/* Logo or Icon */}
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">⚽</span>
            </div>
          </div>

          {/* Loading Message */}
          <h2 className="text-xl font-semibold text-white mb-2">
            {currentMessage}
          </h2>
          
          {showProgress && (
            <>
              {/* Progress Bar */}
              <div className="w-full bg-gray-700/30 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Progress Percentage */}
              <p className="text-sm text-gray-400">
                {Math.round(progress)}%
              </p>
            </>
          )}

          {!showProgress && (
            /* Simple spinner */
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}