// Match event descriptions for team matches
// These can be easily expanded or modified in the future

export const midfieldEvents = {
  success: {
    large: [
      "{attacker} brilliantly outmaneuvers {defender} in midfield!",
      "{attacker} completely dominates the midfield battle against {defender}!",
      "{attacker} shows incredible skill to bypass {defender} in the center!"
    ],
    small: [
      "{attacker} wins the midfield battle against {defender}.",
      "{attacker} manages to get past {defender} in midfield.",
      "{attacker} finds space around {defender}."
    ]
  },
  failure: {
    large: [
      "{defender} completely shuts down {attacker} in midfield.",
      "{defender} reads {attacker}'s intentions perfectly and intercepts.",
      "{defender} dominates the midfield duel against {attacker}."
    ],
    small: [
      "{defender} intercepts {attacker}'s pass.",
      "{defender} blocks {attacker}'s progress in midfield.",
      "{defender} wins the ball from {attacker}."
    ]
  }
};

export const attackEvents = {
  success: {
    large: [
      "{attacker} easily outpaces {defender} and creates a scoring opportunity!",
      "{attacker} leaves {defender} in the dust with a brilliant run!",
      "{attacker} shows incredible skill to beat {defender} on the wing!"
    ],
    small: [
      "{attacker} gets past {defender} and looks to shoot!",
      "{attacker} finds space behind {defender}.",
      "{attacker} creates an opening against {defender}."
    ]
  },
  failure: {
    large: [
      "{defender} makes an incredible tackle to stop {attacker}.",
      "{defender} perfectly times the challenge on {attacker}.",
      "{defender} shows great defensive awareness to shut down {attacker}."
    ],
    small: [
      "{defender} blocks {attacker}'s advance.",
      "{defender} stands firm against {attacker}.",
      "{defender} forces {attacker} to turn back."
    ]
  }
};

export const defenseEvents = {
  success: {
    large: [
      "{attacker} completely outsmarts {defender} with a clever move!",
      "{attacker} shows incredible footwork to beat {defender}!",
      "{attacker} finds a perfect gap in {defender}'s positioning!"
    ],
    small: [
      "{attacker} manages to get around {defender}.",
      "{attacker} creates space against {defender}.",
      "{attacker} finds a way past {defender}."
    ]
  },
  failure: {
    large: [
      "{defender} makes a perfect defensive read against {attacker}.",
      "{defender} times the tackle perfectly to dispossess {attacker}.",
      "{defender} shows exceptional defensive skills against {attacker}."
    ],
    small: [
      "{defender} stands firm against {attacker}'s attempt.",
      "{defender} blocks {attacker}'s progress.",
      "{defender} forces {attacker} to retreat."
    ]
  }
};

export const shotEvents = {
  success: [
    "GOAL! {attacker} shoots past {defender} and finds the back of the net!",
    "GOAL! {attacker} finishes with precision beyond {defender}'s reach!",
    "GOAL! Brilliant finish by {attacker}, leaving {defender} with no chance!",
    "GOAL! {attacker} slots it home despite {defender}'s best efforts!"
  ],
  failure: {
    large: [
      "Incredible save! {defender} denies {attacker} with a spectacular stop!",
      "What a save! {defender} produces a world-class stop to deny {attacker}!",
      "Unbelievable goalkeeping! {defender} somehow keeps out {attacker}'s shot!"
    ],
    small: [
      "{defender} makes the save against {attacker}'s shot.",
      "{defender} gets down well to stop {attacker}'s effort.",
      "{defender} positions well to block {attacker}'s attempt."
    ]
  }
};

export const systemEvents = {
  matchStart: "{homeTeam} vs {awayTeam}",
  tacticInfo: "{team} using {tactic} ({reason})",
  finalWhistle: "Final whistle!",
  possession: "Possession: {homeTeam} {homePossession}% - {awayPossession}% {awayTeam}",
  shots: "Shots: {homeTeam} {homeShots} ({homeShotsOnTarget} on target) - {awayShots} ({awayShotsOnTarget} on target) {awayTeam}",
  finalScore: "Final score: {homeTeam} {homeScore} - {awayScore} {awayTeam}",
  forfeit: "{team} forfeits due to insufficient players",
  bothForfeit: "Both teams forfeit due to insufficient players"
};

// Helper function to get a random event description
export const getRandomDescription = (
  category: any,
  success: boolean,
  margin: number
): string => {
  if (!category) return "Event occurred.";
  
  if (success) {
    if (category.success.large && margin > 5) {
      const descriptions = category.success.large;
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    } else if (category.success.small) {
      const descriptions = category.success.small;
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    } else if (Array.isArray(category.success)) {
      const descriptions = category.success;
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
  } else {
    if (category.failure.large && margin > 5) {
      const descriptions = category.failure.large;
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    } else if (category.failure.small) {
      const descriptions = category.failure.small;
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    } else if (Array.isArray(category.failure)) {
      const descriptions = category.failure;
      return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
  }
  
  return "Event occurred.";
};

// Format a description by replacing placeholders
export const formatDescription = (
  description: string,
  replacements: Record<string, string>
): string => {
  let formattedDescription = description;
  
  for (const [key, value] of Object.entries(replacements)) {
    formattedDescription = formattedDescription.replace(
      new RegExp(`{${key}}`, 'g'),
      value
    );
  }
  
  return formattedDescription;
};