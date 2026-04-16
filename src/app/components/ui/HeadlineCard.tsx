"use client";

import ShareBar from "./ShareBar";

/**
 * HeadlineCard — the shareable, post-match tabloid moment.
 *
 *   ┌───────────────────────────────┐
 *   │ THE POST-MATCH VERDICT        │   ← byline (sans caps)
 *   │                               │
 *   │ OCHOA BRACE SINKS IRONCLAD    │   ← serif headline
 *   │ IN LATE SHOWPIECE             │
 *   │                               │
 *   │ Home team dominated xG from   │
 *   │ the first whistle...          │   ← body
 *   │                               │
 *   │ MATCHDAY 7 · FINAL            │   ← footer
 *   └───────────────────────────────┘
 *
 * Lives in the "newsprint" register. Designed to be screenshotted and
 * shared to Farcaster. Body is optional — headline + byline alone works
 * as a compact social-ready card.
 */

export interface HeadlineCardProps {
  headline: string;
  body?: string;
  byline?: string;
  footer?: string;
  /** Render as a compact card (for feeds) or full (for post-match). */
  variant?: "full" | "compact";
  className?: string;
  onClick?: () => void;
  /** If provided, a ShareBar appears at the bottom. */
  share?: {
    text: string;
    imageUrl: string;
    linkUrl?: string;
  };
}

export default function HeadlineCard({
  headline,
  body,
  byline = "THE POST-MATCH VERDICT",
  footer,
  variant = "full",
  className = "",
  onClick,
  share,
}: HeadlineCardProps) {
  const Wrapper = onClick ? "button" : "div";
  const isFull = variant === "full";

  return (
    <Wrapper
      onClick={onClick}
      className={`tabloid-card block w-full text-left ${className}`}
    >
      <div className="tabloid-byline mb-2">{byline}</div>
      <h2
        className={`tabloid-headline ${
          isFull ? "text-2xl sm:text-3xl" : "text-lg"
        }`}
      >
        {headline}
      </h2>
      {body && isFull && (
        <p className="mt-3 font-serif text-base leading-relaxed text-ink/85">
          {body}
        </p>
      )}
      {share && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/15 pt-3">
          <span className="text-[10px] uppercase tracking-broadcast text-ink/50 font-sans">
            Share the story
          </span>
          <ShareBar
            text={share.text}
            imageUrl={share.imageUrl}
            linkUrl={share.linkUrl}
          />
        </div>
      )}
      {footer && (
        <div className="mt-3 border-t border-ink/15 pt-2 text-[11px] uppercase tracking-broadcast text-ink/60 font-sans">
          {footer}
        </div>
      )}
    </Wrapper>
  );
}
