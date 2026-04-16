import { NarrativeTemplate } from "../types";

/**
 * Goal templates — the most visible part of the commentary system.
 * Each template is tagged so the selector can reach for situational
 * lines (late winner, opener against the run of play, etc.).
 */

export const goalTemplates: NarrativeTemplate[] = [
  // --- Opener / first goal of the match --------------------------------
  {
    id: "goal_opening_level",
    family: "goal",
    tags: { timeBand: "opening", scoreState: "level" },
    lines: [
      "{minute}' — First blood! {attacker} pounces early to open the scoring. The away end is stunned.",
      "{minute}' — The opener arrives with the paint still drying on the touchline. {attacker} makes no mistake.",
      "{minute}' — Barely a breath in and {attacker} has rattled the net. An early statement.",
    ],
    weight: 2,
  },

  // --- Equaliser --------------------------------------------------------
  {
    id: "goal_equaliser_surging",
    family: "goal",
    tags: { scoreState: "level", momentum: "surging" },
    lines: [
      "{minute}' — LEVEL. The pressure finally tells and {attacker} draws {homeTeam} back into it.",
      "{minute}' — They've been camped in the final third and now they've got the equaliser. {attacker} with the finish.",
    ],
  },
  {
    id: "goal_equaliser_pinned",
    family: "goal",
    tags: { scoreState: "level", momentum: "pinned_back" },
    lines: [
      "{minute}' — Against the run of play! {attacker} punishes the only half-chance they've had. 1-1.",
      "{minute}' — From nothing. {attacker} conjures the leveller out of thin air.",
    ],
    weight: 2,
  },

  // --- Late winner / drama in closing / stoppage ------------------------
  {
    id: "goal_late_winner_trailing_counter",
    family: "goal",
    tags: {
      timeBand: ["closing", "stoppage_2"],
      scoreState: "trailing",
      tactic: "counter",
    },
    lines: [
      "{minute}' — They break at pace, the counter is on, and {attacker} finishes it. {homeTeam} have nicked it at the death.",
      "{minute}' — The trap is sprung. {attacker} races through and buries it. Cruel blow for {awayTeam}.",
    ],
    weight: 3,
  },
  {
    id: "goal_stoppage_drama",
    family: "goal",
    tags: { timeBand: "stoppage_2" },
    lines: [
      "{minute}' — Stoppage time heroics! {attacker} writes themselves into the script.",
      "{minute}' — Last kick of the game and {attacker} finds the corner. Scenes.",
    ],
  },

  // --- Brace / already leading big --------------------------------------
  {
    id: "goal_stretching_lead",
    family: "goal",
    tags: { scoreState: "leading" },
    lines: [
      "{minute}' — {attacker} adds a second. {homeTeam} stretch their lead.",
      "{minute}' — Two-goal cushion now. {attacker} with a composed finish.",
    ],
  },
  {
    id: "goal_dagger",
    family: "goal",
    tags: {
      scoreState: "leading_big",
      timeBand: ["closing", "stoppage_2"],
    },
    lines: [
      "{minute}' — The dagger. {attacker} puts the game out of reach.",
      "{minute}' — No way back now. {attacker} rubs it in.",
    ],
    weight: 2,
  },

  // --- Tactical flavour -------------------------------------------------
  {
    id: "goal_tiki_taka",
    family: "goal",
    tags: { tactic: "tiki_taka" },
    lines: [
      "{minute}' — Thirteen passes, one finish. {attacker} caps a passing move of the highest order.",
      "{minute}' — Triangulation in the final third, {assister} slides the ball, {attacker} doesn't miss.",
    ],
  },
  {
    id: "goal_gegenpressing",
    family: "goal",
    tags: { tactic: "gegenpressing" },
    lines: [
      "{minute}' — Won back inside the opposition half and {attacker} finishes. Textbook gegenpress.",
      "{minute}' — The press pays. {attacker} punishes a loose touch with an ice-cold finish.",
    ],
  },
  {
    id: "goal_direct",
    family: "goal",
    tags: { tactic: "direct" },
    lines: [
      "{minute}' — Three passes, that's all it took. Keeper to {assister} to {attacker}, in the net.",
      "{minute}' — Route one at its best. {attacker} beats the offside and finishes first time.",
    ],
  },

  // --- Fallback ---------------------------------------------------------
  {
    id: "goal_generic",
    family: "goal",
    tags: {},
    lines: [
      "{minute}' — GOAL. {attacker} finds the net.",
      "{minute}' — {attacker} strikes. {homeTeam} {homeScore} - {awayScore} {awayTeam}.",
      "{minute}' — Crossbar shakes, net bulges. {attacker} with the finish.",
    ],
  },
];
