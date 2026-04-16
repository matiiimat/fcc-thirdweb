import { IPlayer, IPlayerStats, Position } from "../models/Player";

/**
 * Helpers that build URLs to our OG image endpoints.
 *
 * Keep the shape thin: each helper takes already-hydrated data and returns
 * a fully qualified URL suitable for:
 *   - an <img src> in a preview
 *   - a Warpcast cast embed
 *   - a Farcaster Frame `fc:frame` image
 */

type MaybePartial<T> = { [K in keyof T]?: T[K] };

export interface PlayerCardParams {
  name: string;
  username?: string;
  position?: Position | string;
  rating: number;
  team?: string;
  primaryColor?: string;
  secondaryColor?: string;
  traits?: string[];
  pfp?: string;
  stats: MaybePartial<IPlayerStats>;
}

/** Absolute origin for building public URLs (OG image, cast embeds). */
export function appOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL;
  if (fromEnv) {
    return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "https://fcc-test.vercel.app";
}

export function playerCardOgUrl(params: PlayerCardParams): string {
  const origin = appOrigin();
  const qs = new URLSearchParams();
  qs.set("name", params.name);
  if (params.username) qs.set("username", params.username);
  if (params.position) qs.set("pos", String(params.position));
  qs.set("rating", String(Math.round(params.rating)));
  if (params.team) qs.set("team", params.team);
  if (params.primaryColor) qs.set("primary", params.primaryColor);
  if (params.secondaryColor) qs.set("secondary", params.secondaryColor);
  if (params.traits?.length) qs.set("traits", params.traits.join(","));
  if (params.pfp) qs.set("pfp", params.pfp);

  const s = params.stats;
  if (s.strength !== undefined) qs.set("str", String(s.strength));
  if (s.stamina !== undefined) qs.set("sta", String(s.stamina));
  if (s.passing !== undefined) qs.set("pas", String(s.passing));
  if (s.shooting !== undefined) qs.set("sho", String(s.shooting));
  if (s.defending !== undefined) qs.set("def", String(s.defending));
  if (s.speed !== undefined) qs.set("spe", String(s.speed));
  if (s.positioning !== undefined) qs.set("pos_stat", String(s.positioning));
  if (s.workEthic !== undefined) qs.set("we", String(s.workEthic));

  return `${origin}/api/og/player?${qs.toString()}`;
}

/** Convenience: one-shot from a hydrated IPlayer document. */
export function playerCardOgUrlFromPlayer(
  player: Pick<IPlayer, "playerName" | "username" | "team" | "stats" | "identity">,
  extras: { position?: Position; rating: number; pfp?: string; primaryColor?: string; secondaryColor?: string }
): string {
  const traits = player.identity?.traits ?? [];
  return playerCardOgUrl({
    name: player.playerName,
    username: player.username || undefined,
    position: extras.position,
    rating: extras.rating,
    team: player.team,
    primaryColor: extras.primaryColor,
    secondaryColor: extras.secondaryColor,
    traits,
    pfp: extras.pfp,
    stats: player.stats as IPlayerStats,
  });
}

/** Warpcast compose fallback for clients where `sdk.actions.composeCast` isn't available. */
export function warpcastComposeUrl(text: string, embeds: string[]): string {
  const params = new URLSearchParams();
  params.set("text", text);
  for (const e of embeds) params.append("embeds[]", e);
  return `https://warpcast.com/~/compose?${params.toString()}`;
}
