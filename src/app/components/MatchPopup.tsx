"use client";

import { useEffect, useState, useRef } from "react";
import { Position } from "../models/Player";
import { generateMatchEvents, MatchEvent } from "./MatchEvents";

interface MatchPopupProps {
  selectedPosition: Position;
  playerName: string;
  onClose: () => void;
  matchResult?: {
    rating: number;
    xpGained: number;
  };
}

const MatchPopup: React.FC<MatchPopupProps> = ({
  selectedPosition,
  playerName,
  onClose,
  matchResult,
}) => {
  const [currentMinute, setCurrentMinute] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [showBackButton, setShowBackButton] = useState(false);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventsRef = useRef<MatchEvent[]>([]);

  useEffect(() => {
    // Generate match events immediately
    const matchEvents = generateMatchEvents(selectedPosition, playerName);
    eventsRef.current = matchEvents;
    setEvents(matchEvents);

    // Start the match timer
    timerRef.current = setInterval(() => {
      setCurrentMinute((prev) => {
        const next = prev + 1;
        if (next >= 90) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setShowBackButton(true);
          return 90;
        }
        return next;
      });
    }, 500); // 500ms = 1 minute in game time (50% faster)

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // Empty dependency array since we want this to run once

  // Update score when new events occur
  useEffect(() => {
    const currentEvents = events.filter(
      (event) => event.minute <= currentMinute
    );
    const newScore = currentEvents.reduce(
      (acc, event) => {
        if (event.type === "goal") {
          if (event.team === "player") {
            acc.player += 1;
          } else if (event.team === "opponent") {
            acc.opponent += 1;
          }
        }
        return acc;
      },
      { player: 0, opponent: 0 }
    );
    setScore(newScore);
  }, [currentMinute, events]);

  // Get events up to current minute
  const currentEvents = events.filter((event) => event.minute <= currentMinute);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1a1d21] to-[#0d0f12] rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* Score */}
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-white mb-2">
            {playerName}&apos;s Team {score.player} - {score.opponent} Opponent
          </div>
          <span className="text-2xl font-bold text-white">
            {currentMinute}&apos;
          </span>
        </div>

        {/* Match Events */}
        <div className="h-96 overflow-y-auto mb-4 space-y-2 custom-scrollbar">
          {currentEvents.map((event, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 text-sm animate-fade-in ${
                event.type === "goal"
                  ? "text-yellow-400 font-bold"
                  : "text-white"
              }`}
            >
              <span className="text-green-500 font-medium min-w-[30px]">
                {event.minute}&apos;
              </span>
              <span>{event.text}</span>
            </div>
          ))}

          {/* Show rating and XP gained after final whistle */}
          {currentMinute === 90 && matchResult && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-yellow-400 font-bold text-sm mb-1">
                Rating: {matchResult.rating.toFixed(1)}
              </div>
              <div className="text-green-400 font-bold text-sm">
                XP gained: {matchResult.xpGained}
              </div>
            </div>
          )}
        </div>

        {/* Back Button */}
        {showBackButton && (
          <button
            onClick={onClose}
            className="w-full gradient-button py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchPopup;
