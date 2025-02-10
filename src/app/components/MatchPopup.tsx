"use client";

import { useEffect, useState, useRef } from "react";
import { Position } from "../models/Player";

interface MatchEvent {
  minute: number;
  text: string;
}

interface MatchPopupProps {
  selectedPosition: Position;
  onClose: () => void;
}

const generateMatchEvents = (selectedPosition: Position) => {
  const events: MatchEvent[] = [{ minute: 0, text: "Kick off!" }];

  // Generate random events based on position
  const possibleEvents = {
    D: [
      "makes a crucial tackle",
      "clears the ball",
      "blocks a dangerous shot",
      "intercepts a pass",
    ],
    M: [
      "controls the midfield",
      "makes a great pass",
      "wins the ball back",
      "creates space",
    ],
    F: [
      "takes a shot",
      "dribbles past a defender",
      "makes a run",
      "pressures the defense",
    ],
  };

  // Generate 8-12 events throughout the match
  const numEvents = 8 + Math.floor(Math.random() * 5);
  const eventMinutes = Array.from(
    { length: numEvents },
    () => Math.floor(Math.random() * 89) + 1
  ).sort((a, b) => a - b);

  eventMinutes.forEach((minute) => {
    const success = Math.random() > 0.3; // 70% chance of success
    const positionEvents = possibleEvents[selectedPosition];
    const eventText = success
      ? `Player ${
          positionEvents[Math.floor(Math.random() * positionEvents.length)]
        }`
      : "loses possession";
    events.push({ minute, text: eventText });
  });

  // Add final whistle
  events.push({ minute: 90, text: "Final whistle!" });

  return events;
};

const MatchPopup: React.FC<MatchPopupProps> = ({
  selectedPosition,
  onClose,
}) => {
  const [currentMinute, setCurrentMinute] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [showBackButton, setShowBackButton] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventsRef = useRef<MatchEvent[]>([]);

  useEffect(() => {
    // Generate match events immediately
    const matchEvents = generateMatchEvents(selectedPosition);
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

  // Get events up to current minute
  const currentEvents = events.filter((event) => event.minute <= currentMinute);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1a1d21] to-[#0d0f12] rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* Timer */}
        <div className="text-center mb-4">
          <span className="text-2xl font-bold text-green-500">
            {currentMinute}&apos;
          </span>
        </div>

        {/* Match Events */}
        <div className="h-96 overflow-y-auto mb-4 space-y-2 custom-scrollbar">
          {currentEvents.map((event, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 text-sm animate-fade-in"
            >
              <span className="text-green-500 font-medium min-w-[30px]">
                {event.minute}&apos;
              </span>
              <span className="text-white">{event.text}</span>
            </div>
          ))}
        </div>

        {/* Back Button */}
        {showBackButton && (
          <button
            onClick={onClose}
            className="w-full gradient-button py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          >
            Back to Match Page
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchPopup;
