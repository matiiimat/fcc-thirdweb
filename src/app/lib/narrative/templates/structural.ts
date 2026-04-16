import { NarrativeTemplate } from "../types";

/**
 * Structural events — kickoff, half time, final whistle, subs, cards,
 * tactical shifts. These are the beats between dramatic moments.
 */

export const structuralTemplates: NarrativeTemplate[] = [
  {
    id: "kickoff_rivalry",
    family: "kickoff",
    tags: { stakes: "rivalry" },
    lines: [
      "Kick off — and the derby is underway. Tackles flying from the first whistle.",
      "We're off. No love lost between these two.",
    ],
  },
  {
    id: "kickoff_default",
    family: "kickoff",
    tags: {},
    lines: [
      "Kick off. {homeTeam} get us underway.",
      "We're away. First touch to {homeTeam}.",
    ],
  },

  {
    id: "final_level",
    family: "final_whistle",
    tags: { scoreState: "level" },
    lines: [
      "Full time. Honours even: {homeTeam} {homeScore} - {awayScore} {awayTeam}. A point apiece.",
      "The final whistle. Shared spoils.",
    ],
  },
  {
    id: "final_leading",
    family: "final_whistle",
    tags: { scoreState: ["leading", "leading_big"] },
    lines: [
      "Full time. {homeTeam} take the three points. {homeScore}-{awayScore} the final.",
      "That's it. A win for {homeTeam}.",
    ],
  },
  {
    id: "final_trailing",
    family: "final_whistle",
    tags: { scoreState: ["trailing", "trailing_big"] },
    lines: [
      "Full time. A loss at home: {homeTeam} {homeScore} - {awayScore} {awayTeam}.",
      "The whistle blows. {awayTeam} snatch the points.",
    ],
  },

  {
    id: "card_generic",
    family: "card",
    tags: {},
    lines: [
      "{minute}' — {defender} into the book for a challenge on {attacker}.",
      "{minute}' — Yellow. {defender} won't want another.",
    ],
  },

  {
    id: "sub_generic",
    family: "sub",
    tags: {},
    lines: [
      "{minute}' — Fresh legs. A change for {homeTeam}.",
      "{minute}' — Substitution. The bench empties a fraction.",
    ],
  },

  {
    id: "tactical_shift_trailing",
    family: "tactical_shift",
    tags: { scoreState: ["trailing", "trailing_big"] },
    lines: [
      "{minute}' — The manager rips up the plan. Going direct now.",
      "{minute}' — Shape change. {homeTeam} push a third striker up top.",
    ],
  },
];
