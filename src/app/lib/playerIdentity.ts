import {
  IPlayer,
  IPlayerStats,
  IPlayerIdentity,
  PlayerTrait,
  Position,
} from "../models/Player";

/**
 * Player identity derivation.
 *
 * Inputs: the 7 trainable core stats. Outputs: 8 surface attributes that
 * look and feel FM-flavoured, plus per-position ratings and identity
 * defaults for players created before the identity layer shipped.
 *
 * All functions are pure. Nothing here writes to the database.
 */

// ---------------------------------------------------------------------------
// Surface attributes
// ---------------------------------------------------------------------------

export interface SurfaceAttributes {
  finishing: number;
  firstTouch: number;
  vision: number;
  workRate: number;
  composure: number;
  flair: number;
  leadership: number;
  aggression: number;
}

/**
 * Deterministic pseudo-random in [0, 1) from a string seed. Used so two
 * players with identical stats still get slightly different surface
 * attribute variance.
 */
function seedNoise(seed: string, salt: string): number {
  let h = 2166136261;
  const key = `${seed}::${salt}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Normalize to [0, 1)
  return ((h >>> 0) % 10000) / 10000;
}

function clamp(n: number, lo = 0, hi = 20): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Compute the 8 surface attributes from the 7 core stats.
 * `seed` (e.g. playerId or ethAddress) provides stable per-player variance.
 */
export function deriveSurfaceAttributes(
  stats: IPlayerStats,
  seed = "default"
): SurfaceAttributes {
  const n = (salt: string) => (seedNoise(seed, salt) - 0.5) * 1.4; // ±0.7

  return {
    finishing: clamp(0.7 * stats.shooting + 0.2 * stats.positioning + 0.1 * stats.speed + n("fin")),
    firstTouch: clamp(0.55 * stats.passing + 0.25 * stats.positioning + 0.2 * stats.speed + n("ft")),
    vision: clamp(0.6 * stats.passing + 0.3 * stats.positioning + 0.1 * stats.shooting + n("vis")),
    workRate: clamp(0.5 * stats.stamina + 0.3 * stats.strength + 0.2 * stats.defending + n("wr")),
    composure: clamp(0.4 * stats.positioning + 0.3 * stats.passing + 0.3 * stats.shooting + n("cmp")),
    flair: clamp(0.45 * stats.speed + 0.3 * stats.shooting + 0.25 * stats.passing + n("fla")),
    leadership: clamp(0.35 * stats.defending + 0.35 * stats.positioning + 0.3 * stats.strength + n("lea")),
    aggression: clamp(0.6 * stats.strength + 0.25 * stats.defending + 0.15 * stats.stamina + n("agg")),
  };
}

// ---------------------------------------------------------------------------
// Position ratings
// ---------------------------------------------------------------------------

type StatKey = keyof IPlayerStats;

/** Per-position weights over the 7 core stats. Sum to 1 per position. */
const POSITION_WEIGHTS: Record<Position, Partial<Record<StatKey, number>>> = {
  GK: { positioning: 0.35, defending: 0.2, strength: 0.15, stamina: 0.1, speed: 0.1, passing: 0.1 },
  D:  { defending: 0.3, strength: 0.2, positioning: 0.2, speed: 0.15, stamina: 0.1, passing: 0.05 },
  M:  { passing: 0.3, stamina: 0.2, positioning: 0.15, speed: 0.15, defending: 0.1, shooting: 0.1 },
  F:  { shooting: 0.35, speed: 0.25, positioning: 0.2, stamina: 0.1, passing: 0.05, strength: 0.05 },
};

/**
 * Rating out of 100 for a given position. Work Ethic is a multiplier
 * applied on top, matching how the existing game uses it.
 */
export function positionRating(stats: IPlayerStats, position: Position): number {
  const weights = POSITION_WEIGHTS[position];
  let weighted = 0;
  let weightSum = 0;
  for (const [k, w] of Object.entries(weights) as [StatKey, number][]) {
    weighted += (stats[k] ?? 0) * w;
    weightSum += w;
  }
  // Normalize to 0..100 from 0..20 stat scale.
  const base = (weighted / (weightSum || 1)) * 5;
  const workMultiplier = 0.85 + (stats.workEthic / 20) * 0.3; // 0.85..1.15
  return Math.round(clamp(base * workMultiplier, 0, 100));
}

/** All four position ratings, with `native` called out. */
export function allPositionRatings(
  stats: IPlayerStats,
  native?: Position
): { position: Position; rating: number; native: boolean }[] {
  const positions: Position[] = ["GK", "D", "M", "F"];
  return positions.map((p) => ({
    position: p,
    rating: positionRating(stats, p),
    native: p === native,
  }));
}

// ---------------------------------------------------------------------------
// Trait pool
// ---------------------------------------------------------------------------

export interface TraitDescriptor {
  id: PlayerTrait;
  name: string;
  description: string;
  /** Rarity: higher = less common at creation. */
  rarity: number;
}

export const TRAIT_POOL: TraitDescriptor[] = [
  {
    id: "big_game_player",
    name: "Big Game Player",
    description: "Rises to the occasion in rivalry and title-deciding matches.",
    rarity: 4,
  },
  {
    id: "injury_prone",
    name: "Injury Prone",
    description: "Picks up knocks more often, but bounces back quickly.",
    rarity: 2,
  },
  {
    id: "consistent",
    name: "Consistent",
    description: "Reduced match-to-match rating variance.",
    rarity: 2,
  },
  {
    id: "late_bloomer",
    name: "Late Bloomer",
    description: "Training gains increase later in a career.",
    rarity: 4,
  },
  {
    id: "set_piece_specialist",
    name: "Set Piece Specialist",
    description: "Higher chance of scoring from free kicks and corners.",
    rarity: 3,
  },
  {
    id: "leader",
    name: "Leader",
    description: "Team-wide morale boost when wearing the armband.",
    rarity: 5,
  },
  {
    id: "flair",
    name: "Flair",
    description: "Commentary leans toward the outrageous; higher upside moments.",
    rarity: 3,
  },
  {
    id: "engine",
    name: "Engine",
    description: "Fatigue decays faster. Never looks tired.",
    rarity: 3,
  },
  {
    id: "cool_head",
    name: "Cool Head",
    description: "Less likely to pick up bookings. Higher composure under pressure.",
    rarity: 2,
  },
  {
    id: "workhorse",
    name: "Workhorse",
    description: "Better training efficiency per session.",
    rarity: 2,
  },
  {
    id: "streaky",
    name: "Streaky",
    description: "Form compounds — hot streaks run hotter, slumps run deeper.",
    rarity: 2,
  },
  {
    id: "ice_in_veins",
    name: "Ice In Veins",
    description: "Penalty and high-leverage finishing bonus.",
    rarity: 4,
  },
];

/**
 * Roll 2–3 traits for a new player. Weighted against rarity so common
 * traits show up more often. Deterministic given the seed.
 */
export function rollTraits(seed: string, count = 2): PlayerTrait[] {
  const desired = Math.max(1, Math.min(3, count));
  const pool = [...TRAIT_POOL];
  const picked: PlayerTrait[] = [];

  for (let i = 0; i < desired && pool.length > 0; i++) {
    const weights = pool.map((t) => 1 / t.rarity);
    const total = weights.reduce((s, w) => s + w, 0);
    let roll = seedNoise(seed, `trait-${i}`) * total;
    let idx = 0;
    for (let j = 0; j < weights.length; j++) {
      roll -= weights[j];
      if (roll <= 0) {
        idx = j;
        break;
      }
    }
    picked.push(pool[idx].id);
    pool.splice(idx, 1);
  }
  return picked;
}

export function getTraitDescriptor(id: PlayerTrait): TraitDescriptor | undefined {
  return TRAIT_POOL.find((t) => t.id === id);
}

// ---------------------------------------------------------------------------
// Identity defaults
// ---------------------------------------------------------------------------

/**
 * Produce the identity a player should have if their stored identity is
 * null/undefined. Lets the UI render identity-aware components safely for
 * legacy players who haven't been migrated yet.
 *
 * Traits start empty: they are acquired through the in-game store (max 2),
 * not assigned automatically at creation.
 */
export function defaultIdentity(
  _player?: Pick<IPlayer, "playerId" | "ethAddress">
): IPlayerIdentity {
  return {
    form: 0,
    morale: 60,
    fatigue: 0,
    condition: 100,
    traits: [],
    injury: null,
    career: [],
  };
}

/** Merge whatever identity is stored with defaults so every field is defined. */
export function resolveIdentity(
  player: Pick<IPlayer, "playerId" | "ethAddress" | "identity">
): IPlayerIdentity {
  const fallback = defaultIdentity(player);
  if (!player.identity) return fallback;
  return {
    form: player.identity.form ?? fallback.form,
    morale: player.identity.morale ?? fallback.morale,
    fatigue: player.identity.fatigue ?? fallback.fatigue,
    condition: player.identity.condition ?? fallback.condition,
    traits: player.identity.traits?.length ? player.identity.traits : fallback.traits,
    jerseyNumber: player.identity.jerseyNumber,
    preferredFoot: player.identity.preferredFoot,
    injury: player.identity.injury ?? null,
    career: player.identity.career ?? [],
    lastRatings: player.identity.lastRatings ?? [],
    lastTickedAt: player.identity.lastTickedAt ?? null,
  };
}

// ---------------------------------------------------------------------------
// Label helpers (for UI)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event application
//
// Pure functions that transform an identity given an event. Consumed by the
// train + solomatch + team-match API routes. Returning a full IPlayerIdentity
// (not a diff) makes it trivial to `$set` the whole subdocument atomically.
// ---------------------------------------------------------------------------

/** Clamp a number into [lo, hi]. */
function clampN(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

const MAX_RATINGS = 5;

/**
 * Recompute `form` from the last N ratings. Returns a value in [-3, +3].
 * EMA with alpha=0.4, anchored against a 6.5 baseline (FM-ish "par" rating).
 */
export function computeForm(ratings: number[]): number {
  if (!ratings || ratings.length === 0) return 0;
  const alpha = 0.4;
  let ema = 0;
  for (const r of ratings) {
    ema = alpha * (r - 6.5) + (1 - alpha) * ema;
  }
  return clampN(Number(ema.toFixed(2)), -3, 3);
}

function hasTrait(traits: PlayerTrait[] | undefined, t: PlayerTrait): boolean {
  return (traits ?? []).includes(t);
}

export interface TrainEventInput {
  intensity?: "light" | "focused" | "intense";
}

/** Apply a training event to an identity. Pure. */
export function applyTrainEvent(
  identity: IPlayerIdentity,
  input: TrainEventInput = {}
): IPlayerIdentity {
  const intensity = input.intensity ?? "focused";
  const fatigueDelta =
    intensity === "light" ? 5 : intensity === "intense" ? 30 : 15;
  const conditionDelta = intensity === "intense" ? -2 : 0;

  return {
    ...identity,
    fatigue: clampN(identity.fatigue + fatigueDelta, 0, 100),
    condition: clampN(identity.condition + conditionDelta, 0, 100),
  };
}

export interface MatchEventInput {
  /** The player's match rating, 0-10. */
  rating: number;
  /** "win" | "loss" | "draw" from the player team's perspective. */
  result: "win" | "loss" | "draw";
  /** Was this match a rivalry / derby? Morale swings are larger. */
  rivalry?: boolean;
  /** Did the player earn Player of the Match? */
  potm?: boolean;
  /** Previously-captured ratings list (may be undefined for legacy players). */
  lastRatings?: number[];
}

/** Apply a match event to an identity. Pure. */
export function applyMatchEvent(
  identity: IPlayerIdentity,
  input: MatchEventInput
): IPlayerIdentity {
  const { rating, result, rivalry = false, potm = false, lastRatings } = input;

  // Fatigue rises sharply from a match.
  let fatigueDelta = 30;
  if (hasTrait(identity.traits, "engine")) fatigueDelta -= 5;
  if (hasTrait(identity.traits, "injury_prone")) fatigueDelta += 3;

  // Morale swing from result.
  let moraleDelta = 0;
  if (result === "win") moraleDelta += rivalry ? 8 : 5;
  else if (result === "loss") moraleDelta += rivalry ? -12 : -8;
  else moraleDelta += -1;
  if (potm) moraleDelta += 10;
  if (hasTrait(identity.traits, "streaky")) moraleDelta *= 1.5;

  // Form — append this rating, cap length, recompute EMA.
  const nextRatings = [...(lastRatings ?? []), rating].slice(-MAX_RATINGS);
  const nextForm = computeForm(nextRatings);

  return {
    ...identity,
    fatigue: clampN(identity.fatigue + fatigueDelta, 0, 100),
    condition: clampN(identity.condition - 2, 0, 100),
    morale: clampN(identity.morale + moraleDelta, 0, 100),
    form: nextForm,
  };
}

/**
 * Apply passive recovery for time spent idle. Called on read so we don't need
 * a cron: compute the hours since last action, decay fatigue accordingly.
 */
export function applyPassiveRecovery(
  identity: IPlayerIdentity,
  hoursIdle: number
): IPlayerIdentity {
  if (hoursIdle <= 0) return identity;

  // Fatigue: -5/hour, more if "engine", less if "injury_prone".
  let fatigueRate = 5;
  if (hasTrait(identity.traits, "engine")) fatigueRate = 6;
  if (hasTrait(identity.traits, "injury_prone")) fatigueRate = 4;

  // Condition: +0.5/hour normal; 0 while injured.
  const conditionRate = identity.injury ? 0 : 0.5;

  return {
    ...identity,
    fatigue: clampN(identity.fatigue - fatigueRate * hoursIdle, 0, 100),
    condition: clampN(identity.condition + conditionRate * hoursIdle, 0, 100),
  };
}

/**
 * Rating multiplier suggested by morale + form. Consumer routes multiply the
 * base rating by this before persisting. Kept in one place so the rule is
 * auditable.
 */
export function ratingMultiplier(identity: IPlayerIdentity): number {
  let m = 1.0;
  if (identity.morale >= 80) m *= 1.05;
  else if (identity.morale < 30) m *= 0.95;

  // Form effect is linear: each +1 form ⇒ +3.3% rating; each -1 ⇒ -3.3%.
  m *= 1 + identity.form * 0.033;

  // Fatigue penalty kicks in above 80.
  if (identity.fatigue > 80) m *= 0.7;
  else if (identity.fatigue > 60) m *= 0.9;

  return Number(m.toFixed(3));
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export function formLabel(form: number): "hot" | "good" | "steady" | "poor" | "cold" {
  if (form >= 2) return "hot";
  if (form >= 0.75) return "good";
  if (form >= -0.75) return "steady";
  if (form >= -2) return "poor";
  return "cold";
}

export function moraleLabel(morale: number): "flying" | "upbeat" | "steady" | "downbeat" | "rock_bottom" {
  if (morale >= 80) return "flying";
  if (morale >= 60) return "upbeat";
  if (morale >= 40) return "steady";
  if (morale >= 20) return "downbeat";
  return "rock_bottom";
}
