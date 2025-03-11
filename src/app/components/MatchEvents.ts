import { Position } from "../models/Player";

export interface MatchEvent {
  minute: number;
  text: string;
  type: "goal" | "action" | "system";
  team?: "player" | "opponent";
}

const generateGoalEvents = (displayName: string): MatchEvent[] => {
  // Generate 0-5 goals
  const numGoals = Math.floor(Math.random() * 6); // 0 to 5 goals
  const events: MatchEvent[] = [];
  
  if (numGoals === 0) {
    return events;
  }
  
  // Generate random minutes for goals, ensuring they're spread out
  const possibleMinutes = Array.from({ length: 85 }, (_, i) => i + 5); // 5-89 minutes
  const goalMinutes: number[] = [];
  
  for (let i = 0; i < numGoals; i++) {
    const randomIndex = Math.floor(Math.random() * possibleMinutes.length);
    goalMinutes.push(possibleMinutes[randomIndex]);
    // Remove this minute and surrounding minutes to ensure goals aren't too close
    possibleMinutes.splice(Math.max(0, randomIndex - 2), 5);
  }
  
  goalMinutes.sort((a, b) => a - b);
  
  // Generate goal events with roughly 60% chance for player team
  goalMinutes.forEach(minute => {
    const isPlayerTeam = Math.random() < 0.6;
    if (isPlayerTeam) {
      // For player team goals, 50% chance to be scored by player
      const isPlayerGoal = Math.random() < 0.5;
      const scenarios = isPlayerGoal ? [
        `GOAL! ${displayName} scores a brilliant goal!`,
        `GOAL! ${displayName} finds the back of the net!`,
        `GOAL! Incredible finish by ${displayName}!`
      ] : [
        `GOAL! ${displayName}'s teammate finds the back of the net!`,
        `GOAL! Beautiful team play by the home team leads to a goal!`,
        `GOAL! The home crowd erupts as ${displayName}'s team scores!`
      ];
      events.push({
        minute,
        text: scenarios[Math.floor(Math.random() * scenarios.length)],
        type: "goal",
        team: "player"
      });
    } else {
      const scenarios = [
        "GOAL! The away team finds the back of the net!",
        "GOAL! The visitors break through and score!",
        "GOAL! The rival team equalizes!",
        "GOAL! The opposing striker makes no mistake!"
      ];
      events.push({
        minute,
        text: scenarios[Math.floor(Math.random() * scenarios.length)],
        type: "goal",
        team: "opponent"
      });
    }
  });
  
  return events;
};

const getRandomTeamAction = (position: Position, displayName: string): string => {
  // 50% chance to involve player in team actions
  const includePlayer = Math.random() < 0.5;
  
  const teamActions = {
    GK: includePlayer ? [
      `${displayName} organizes the defense from the back`,
      `${displayName} shows great communication with the backline`,
      `${displayName} positions the wall perfectly`
    ] : [
      "The goalkeeper commands their area well",
      "Great organization from the back",
      "The keeper's distribution is excellent"
    ],
    D: includePlayer ? [
      `${displayName}'s defensive partner makes a crucial block`,
      `${displayName} combines with teammates to clear the danger`,
      `${displayName} organizes the defensive line`
    ] : [
      "The home team's defense stands firm",
      "A brilliant defensive display by the back line",
      "The defensive unit stays organized"
    ],
    M: includePlayer ? [
      `${displayName} orchestrates a flowing team move`,
      `${displayName} combines with the midfield`,
      `${displayName} leads the press`
    ] : [
      "The midfield trio combines beautifully",
      "The home team controls possession",
      "Quick one-touch passing in midfield"
    ],
    F: includePlayer ? [
      `${displayName} links up with the striker`,
      `${displayName} creates space for teammates`,
      `${displayName} leads the counter-attack`
    ] : [
      "The forward line pressures high",
      "The attacking trio creates chaos",
      "The home team's forwards combine well"
    ]
  };
  return teamActions[position][Math.floor(Math.random() * teamActions[position].length)];
};

const getRandomOpponentAction = (position: Position): string => {
  const opponentActions = {
    GK: [
      "The opposing keeper makes a confident claim",
      "The away team's goalkeeper organizes their defense",
      "The rival keeper's distribution is precise",
      "The opposing goalkeeper shows great positioning"
    ],
    D: [
      "The away team probes the defense",
      "The opposing forwards press high",
      "The visitors launch a counter-attack",
      "The rival team tests the backline"
    ],
    M: [
      "The opposition midfield battles for control",
      "The away team's midfielder makes a run",
      "The visitors try to dominate possession",
      "The opposing team pushes forward"
    ],
    F: [
      "The rival defense holds firm",
      "The away team's keeper makes a save",
      "The opposing defenders clear the danger",
      "The visitors' backline stays organized"
    ]
  };
  return opponentActions[position][Math.floor(Math.random() * opponentActions[position].length)];
};

export const generateMatchEvents = (selectedPosition: Position, displayName: string): MatchEvent[] => {
  const events: MatchEvent[] = [{ minute: 0, text: "Kick off!", type: "system" }];

  // Add goal events
  const goalEvents = generateGoalEvents(displayName);
  events.push(...goalEvents);

  // Generate random events based on position
  const possibleEvents = {
    GK: [
      "makes a great save",
      "claims the cross confidently",
      "distributes the ball quickly",
      "comes off their line well",
    ],
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

  // Generate 6-8 action events throughout the match
  const numEvents = 6 + Math.floor(Math.random() * 3);
  const eventMinutes = Array.from(
    { length: numEvents },
    () => Math.floor(Math.random() * 89) + 1
  ).sort((a, b) => a - b);

  eventMinutes.forEach((minute) => {
    const eventType = Math.random();
    let eventText: string;
    
    if (eventType < 0.4) { // 40% chance for player action
      const success = Math.random() > 0.3; // 70% chance of success
      const positionEvents = possibleEvents[selectedPosition];
      eventText = success
        ? `${displayName} ${positionEvents[Math.floor(Math.random() * positionEvents.length)]}`
        : `${displayName} loses possession`;
    } else if (eventType < 0.7) { // 30% chance for team action
      eventText = getRandomTeamAction(selectedPosition, displayName);
    } else { // 30% chance for opponent action
      eventText = getRandomOpponentAction(selectedPosition);
    }
    
    events.push({ minute, text: eventText, type: "action" });
  });

  // Add final whistle
  events.push({ minute: 90, text: "Final whistle!", type: "system" });

  // Sort all events by minute
  return events.sort((a, b) => a.minute - b.minute);
};