import { NarrativeTemplate } from "../types";

/**
 * Big chances, saves, and non-goal attacking moments.
 * These fill the minutes between goals and carry the "live" feel.
 */

export const chanceTemplates: NarrativeTemplate[] = [
  {
    id: "chance_opening",
    family: "big_chance",
    tags: { timeBand: "opening" },
    lines: [
      "{minute}' — Early warning. {attacker} flashes one across the face of goal.",
      "{minute}' — {attacker} tests the keeper with an effort from the edge.",
      "{minute}' — Half chance falls to {attacker}; the angle is tight and it drifts wide.",
    ],
  },
  {
    id: "chance_surging",
    family: "big_chance",
    tags: { momentum: "surging" },
    lines: [
      "{minute}' — Pinball in the box. {attacker} can't quite steer it goalward.",
      "{minute}' — The pressure is relentless. {attacker}'s header is tipped over.",
    ],
  },
  {
    id: "chance_closing_trailing",
    family: "big_chance",
    tags: { timeBand: ["closing", "stoppage_2"], scoreState: ["trailing", "trailing_big"] },
    lines: [
      "{minute}' — Throwing everything at it now. {attacker}'s shot cannons off the post.",
      "{minute}' — Last roll of the dice. {attacker} should score and doesn't.",
    ],
  },
  {
    id: "chance_generic",
    family: "big_chance",
    tags: {},
    lines: [
      "{minute}' — {attacker} threads it through but the angle closes.",
      "{minute}' — Chance for {attacker}. Denied.",
      "{minute}' — Half-opening, {attacker} can't get it under control in time.",
    ],
  },

  // --- Saves ------------------------------------------------------------
  {
    id: "save_stunner",
    family: "save",
    tags: {},
    lines: [
      "{minute}' — WHAT A SAVE. {goalkeeper} gets a fingertip to {attacker}'s strike.",
      "{minute}' — {goalkeeper} is equal to it, standing tall to deny {attacker}.",
      "{minute}' — Brilliant stop from {goalkeeper}. {attacker} can't believe it's stayed out.",
    ],
  },
  {
    id: "save_closing",
    family: "save",
    tags: { timeBand: ["closing", "stoppage_2"] },
    lines: [
      "{minute}' — The save of the match, and it might be the winning one. {goalkeeper} denies {attacker}.",
      "{minute}' — {goalkeeper} stretches to claim it. This is a keeper in the zone.",
    ],
    weight: 2,
  },
];
