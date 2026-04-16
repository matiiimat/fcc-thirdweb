import {
  NarrativeTemplate,
  NarrativeContext,
  EventFamily,
  HeadlineTemplate,
} from "./types";

/** True if `value` is in the allowed set — handles scalar or array tag form. */
function tagMatches<T>(allowed: T | T[] | undefined, value: T): boolean {
  if (allowed === undefined) return true; // wildcard
  if (Array.isArray(allowed)) return allowed.includes(value);
  return allowed === value;
}

function matchesContext(
  tpl: NarrativeTemplate,
  ctx: NarrativeContext
): boolean {
  const t = tpl.tags;
  return (
    tagMatches(t.timeBand, ctx.timeBand) &&
    tagMatches(t.scoreState, ctx.scoreState) &&
    tagMatches(t.momentum, ctx.momentum) &&
    (t.tactic === undefined || (ctx.tactic !== undefined && tagMatches(t.tactic, ctx.tactic))) &&
    (t.stakes === undefined || (ctx.stakes !== undefined && tagMatches(t.stakes, ctx.stakes)))
  );
}

/**
 * Score a template's specificity. More non-wildcard tags = higher score.
 * Ties are broken by template.weight.
 */
function specificity(tpl: NarrativeTemplate): number {
  const t = tpl.tags;
  let score = 0;
  if (t.timeBand !== undefined) score += 2;
  if (t.scoreState !== undefined) score += 2;
  if (t.momentum !== undefined) score += 1;
  if (t.tactic !== undefined) score += 2;
  if (t.stakes !== undefined) score += 3;
  return score;
}

/**
 * Pick the best template for a given family + context. Among candidates with
 * equal specificity, weighted-random selection across their lines.
 */
export function selectTemplate(
  templates: NarrativeTemplate[],
  family: EventFamily,
  ctx: NarrativeContext
): NarrativeTemplate | null {
  const candidates = templates.filter(
    (t) => t.family === family && matchesContext(t, ctx)
  );
  if (candidates.length === 0) return null;

  const maxSpec = Math.max(...candidates.map(specificity));
  const best = candidates.filter((t) => specificity(t) === maxSpec);

  const totalWeight = best.reduce((s, t) => s + (t.weight ?? 1), 0);
  let roll = Math.random() * totalWeight;
  for (const t of best) {
    roll -= t.weight ?? 1;
    if (roll <= 0) return t;
  }
  return best[0];
}

/** Pick a single line from a template, uniformly at random. */
export function pickLine(tpl: NarrativeTemplate): string {
  if (tpl.lines.length === 0) return "";
  return tpl.lines[Math.floor(Math.random() * tpl.lines.length)];
}

/** Render a line by replacing {placeholders} with context fields. */
export function render(line: string, ctx: NarrativeContext): string {
  const dict: Record<string, string | number | undefined> = {
    minute: ctx.minute,
    homeTeam: ctx.homeTeam,
    awayTeam: ctx.awayTeam,
    homeScore: ctx.homeScore,
    awayScore: ctx.awayScore,
    attacker: ctx.attacker,
    assister: ctx.assister,
    defender: ctx.defender,
    goalkeeper: ctx.goalkeeper,
    ...(ctx.extra ?? {}),
  };
  return line.replace(/\{(\w+)\}/g, (_, key) => {
    const val = dict[key];
    return val === undefined || val === null ? "" : String(val);
  });
}

/** One-shot: pick a template + line + render. Returns null if no match. */
export function narrate(
  templates: NarrativeTemplate[],
  family: EventFamily,
  ctx: NarrativeContext
): string | null {
  const tpl = selectTemplate(templates, family, ctx);
  if (!tpl) return null;
  return render(pickLine(tpl), ctx);
}

/* ------------------------------------------------------------------ */
/* Headline selection — same logic, different shape                   */
/* ------------------------------------------------------------------ */

function headlineMatches(
  tpl: HeadlineTemplate,
  ctx: NarrativeContext & { closeGame: boolean; blowout: boolean }
): boolean {
  const t = tpl.tags;
  return (
    tagMatches(t.scoreState, ctx.scoreState) &&
    (t.stakes === undefined ||
      (ctx.stakes !== undefined && tagMatches(t.stakes, ctx.stakes))) &&
    (t.closeGame === undefined || t.closeGame === ctx.closeGame) &&
    (t.blowout === undefined || t.blowout === ctx.blowout)
  );
}

export function selectHeadline(
  templates: HeadlineTemplate[],
  ctx: NarrativeContext
): { headline: string; body?: string } | null {
  const diff = Math.abs(ctx.homeScore - ctx.awayScore);
  const closeGame = diff <= 1 && ctx.homeScore + ctx.awayScore >= 1;
  const blowout = diff >= 3;

  const candidates = templates.filter((t) =>
    headlineMatches(t, { ...ctx, closeGame, blowout })
  );
  if (candidates.length === 0) return null;

  const pickOne = <T,>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];
  const chosen = pickOne(candidates);
  const rawHeadline = pickOne(chosen.headlines);
  const rawBody = chosen.bodies ? pickOne(chosen.bodies) : undefined;

  return {
    headline: render(rawHeadline, ctx).toUpperCase(),
    body: rawBody ? render(rawBody, ctx) : undefined,
  };
}
