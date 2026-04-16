import { buildContext } from "./context";
import { selectHeadline } from "./select";
import { ALL_HEADLINE_TEMPLATES } from "./index";

export interface HeadlineInput {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  /** Top-scoring / top-rated performer on the home side. Used in templates. */
  topPerformer?: string;
  stakes?: "rivalry" | "title_race" | "relegation" | "mid_table";
  matchday?: string | number;
}

export interface GeneratedHeadline {
  headline: string;
  body?: string;
  byline: string;
  footer?: string;
}

/**
 * Generate a post-match headline + body + footer ready for <HeadlineCard />.
 *
 * Always returns something — the fallback template matches any context.
 */
export function generateHeadline(input: HeadlineInput): GeneratedHeadline {
  const ctx = buildContext({
    minute: 90,
    homeTeam: input.homeTeam,
    awayTeam: input.awayTeam,
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    attacker: input.topPerformer,
    stakes: input.stakes,
  });

  const picked = selectHeadline(ALL_HEADLINE_TEMPLATES, ctx) || {
    headline: `${input.homeTeam} ${input.homeScore} - ${input.awayScore} ${input.awayTeam}`,
    body: undefined,
  };

  const footerParts: string[] = [];
  if (input.matchday !== undefined) footerParts.push(`Matchday ${input.matchday}`);
  footerParts.push("Full Time");

  return {
    headline: picked.headline,
    body: picked.body,
    byline: "THE POST-MATCH VERDICT",
    footer: footerParts.join(" · "),
  };
}
