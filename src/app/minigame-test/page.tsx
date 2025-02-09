"use client";

import { useState } from "react";
import DefendingGame from "../components/DefendingGame";

export default function MinigameTest() {
  const [gameResult, setGameResult] = useState<string | null>(null);

  const handleGameComplete = (success: boolean) => {
    setGameResult(success ? "Defense successful!" : "Goal scored!");
  };

  return (
    <main
      className="min-h-screen bg-gray-900 text-white p-4 touch-none"
      onTouchMove={(e) => e.preventDefault()}
    >
      <div className="container mx-auto max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Defending Mini-Game
        </h1>

        {gameResult ? (
          <div className="mb-6 text-center">
            <p className="text-xl mb-4">{gameResult}</p>
            <button
              onClick={() => {
                setGameResult(null);
                window.location.reload();
              }}
              className="px-6 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition-colors"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-lg mb-3 text-center font-bold">Instructions:</p>
            <ul className="list-disc list-inside space-y-2 mb-4 max-w-md mx-auto text-sm">
              <li className="text-yellow-400 font-bold">
                You only get ONE attempt to tap the ball!
              </li>
              <li>The ball will come from random directions</li>
              <li>Ball speed varies (4-6x faster)</li>
              <li>Ball may bounce off walls</li>
              <li>Miss your tap = Goal scored!</li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-900 rounded-lg text-yellow-200 text-sm text-center">
              ⚠️ Choose your moment carefully - you can&apos;t tap multiple
              times!
            </div>
          </div>
        )}

        <div className="flex justify-center items-center touch-none">
          <DefendingGame onGameComplete={handleGameComplete} />
        </div>

        <div className="mt-4 text-center text-xs text-gray-400">
          Check the console for detailed game results
        </div>
      </div>
    </main>
  );
}
