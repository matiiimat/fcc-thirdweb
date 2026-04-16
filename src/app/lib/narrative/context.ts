import { TimeBand, ScoreState, Momentum, NarrativeContext } from "./types";

/** Derive the time band from a minute in a 90+ match. */
export function bandFor(minute: number): TimeBand {
  if (minute <= 15) return "opening";
  if (minute <= 44) return "first_half";
  if (minute === 45) return "stoppage_1";
  if (minute <= 74) return "second_half";
  if (minute <= 89) return "closing";
  return "stoppage_2";
}

/** Derive the scoreline state *from the perspective of the home team*. */
export function scoreStateFor(homeScore: number, awayScore: number): ScoreState {
  const diff = homeScore - awayScore;
  if (diff >= 2) return "leading_big";
  if (diff === 1) return "leading";
  if (diff === 0) return "level";
  if (diff === -1) return "trailing";
  return "trailing_big";
}

/** Map a raw momentum value [-100..100] into a coarse bucket. */
export function momentumBucket(value: number): Momentum {
  if (value >= 25) return "surging";
  if (value <= -25) return "pinned_back";
  return "steady";
}

/** Convenience: build a full NarrativeContext from the minimum inputs. */
export function buildContext(input: {
  minute: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  momentum?: number;
  tactic?: NarrativeContext["tactic"];
  stakes?: NarrativeContext["stakes"];
  attacker?: string;
  assister?: string;
  defender?: string;
  goalkeeper?: string;
  extra?: NarrativeContext["extra"];
}): NarrativeContext {
  const {
    minute,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    momentum = 0,
    tactic,
    stakes,
    attacker,
    assister,
    defender,
    goalkeeper,
    extra,
  } = input;

  return {
    minute,
    timeBand: bandFor(minute),
    scoreState: scoreStateFor(homeScore, awayScore),
    momentum: momentumBucket(momentum),
    tactic,
    stakes,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    attacker,
    assister,
    defender,
    goalkeeper,
    extra,
  };
}
