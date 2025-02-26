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
  }, [selectedPosition, playerName]); // Add required dependencies

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
    <div className="fixed inset-x-0 top-0 bg-black bg-opacity-50 z-50">
      <div className="bg-gradient-to-b from-[#1a1d21] to-[#0d0f12] rounded-b-lg max-w-md mx-auto p-6 shadow-xl">
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
          {/* Show rating and XP gained after final whistle */}
          {currentMinute === 90 && matchResult && (
            <div className="mb-4 pb-4 border-b border-gray-700">
              <div className="text-yellow-400 font-bold text-sm">
                Rating: {matchResult.rating.toFixed(1)}
              </div>
            </div>
          )}
          {[...currentEvents].reverse().map((event, index) => (
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
