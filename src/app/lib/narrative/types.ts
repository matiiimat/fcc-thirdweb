/**
 * Narrative template type system.
 *
 * The old matchEventDescriptions.ts is a flat bag of lines. This module
 * rebuilds commentary around *tagged templates* so the selected line can
 * respond to scoreline, time band, tactic, momentum, and rivalry state.
 *
 * This module is pure (no DB, no React). It's consumed by:
 *   - match simulators (team + solo)
 *   - post-match HeadlineCard generator
 *   - cooldown diary generator
 */

export type TimeBand =
  | "opening"     // 1-15
  | "first_half"  // 16-44
  | "stoppage_1"  // 45+
  | "second_half" // 46-74
  | "closing"     // 75-89
  | "stoppage_2"; // 90+

export type ScoreState =
  | "leading_big" // +2 or more
  | "leading"     // +1
  | "level"
  | "trailing"    // -1
  | "trailing_big"; // -2 or more

export type Momentum = "surging" | "steady" | "pinned_back";

export type TacticStyle =
  | "tiki_taka"
  | "gegenpressing"
  | "counter"
  | "park_the_bus"
  | "direct";

export type EventFamily =
  | "goal"
  | "big_chance"
  | "save"
  | "foul"
  | "card"
  | "sub"
  | "tactical_shift"
  | "kickoff"
  | "final_whistle"
  | "key_moment";

export type Stakes = "rivalry" | "title_race" | "relegation" | "mid_table";

export interface NarrativeContext {
  minute: number;
  timeBand: TimeBand;
  scoreState: ScoreState;
  momentum: Momentum;
  tactic?: TacticStyle;
  stakes?: Stakes;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  attacker?: string;
  assister?: string;
  defender?: string;
  goalkeeper?: string;
  /** Arbitrary extras a specific template may interpolate. */
  extra?: Record<string, string | number>;
}

export interface NarrativeTemplate {
  id: string;
  family: EventFamily;
  /** All listed tags must match context for the template to be eligible. */
  tags: {
    timeBand?: TimeBand | TimeBand[];
    scoreState?: ScoreState | ScoreState[];
    momentum?: Momentum | Momentum[];
    tactic?: TacticStyle | TacticStyle[];
    stakes?: Stakes | Stakes[];
  };
  lines: string[];
  /** Higher = preferred when multiple templates match. Default 1. */
  weight?: number;
}

export interface HeadlineTemplate {
  id: string;
  tags: {
    scoreState?: ScoreState | ScoreState[];
    stakes?: Stakes | Stakes[];
    closeGame?: boolean;
    blowout?: boolean;
  };
  headlines: string[];
  bodies?: string[];
  weight?: number;
}
