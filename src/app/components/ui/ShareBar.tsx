"use client";

import { useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { warpcastComposeUrl } from "../../lib/ogUrl";

/**
 * ShareBar — a small toolbar for sharing a card as a Farcaster cast.
 *
 *   [ Cast ]  [ Copy link ]
 *
 * Prefers `sdk.actions.composeCast` when available; falls back to
 * `sdk.actions.openUrl` with a Warpcast compose URL so it still works in
 * non-frame contexts (mobile web, in-app browser).
 */

export interface ShareBarProps {
  /** Cast body text. Keep under ~320 chars to avoid truncation. */
  text: string;
  /** Public image URL (usually from /api/og/*). First embed shows large. */
  imageUrl: string;
  /** Optional second embed — e.g. deep link back to the frame. */
  linkUrl?: string;
  /**
   * Layout. Default is a full cast + copy bar (for tabloid footers).
   * "icon" collapses to a single subtle icon button — suitable for inline
   * placement next to a player name.
   */
  variant?: "full" | "icon";
  /** Accessible label for the icon variant. Defaults to "Share". */
  ariaLabel?: string;
  className?: string;
}

async function tryHaptic(): Promise<void> {
  try {
    const caps = await sdk.getCapabilities();
    if (caps.includes("haptics.impactOccurred")) {
      await sdk.haptics.impactOccurred("medium");
    }
  } catch {
    /* silent */
  }
}

export default function ShareBar({
  text,
  imageUrl,
  linkUrl,
  variant = "full",
  ariaLabel = "Share",
  className = "",
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const embeds = [imageUrl, ...(linkUrl ? [linkUrl] : [])];

  const handleCast = async () => {
    if (busy) return;
    setBusy(true);
    await tryHaptic();
    try {
      // Preferred path: native compose action inside a Frame.
      const actions = sdk.actions as any;
      if (actions && typeof actions.composeCast === "function") {
        await actions.composeCast({ text, embeds });
      } else if (actions && typeof actions.openUrl === "function") {
        await actions.openUrl(warpcastComposeUrl(text, embeds));
      } else if (typeof window !== "undefined") {
        window.open(warpcastComposeUrl(text, embeds), "_blank");
      }
    } catch {
      // Last-ditch fallback: pop Warpcast in a new tab.
      if (typeof window !== "undefined") {
        window.open(warpcastComposeUrl(text, embeds), "_blank");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  // Small inline SVG — recognizable "share" arrow-up-from-square glyph.
  const ShareIcon = ({ size = 14 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleCast}
        disabled={busy}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-floodlight/15 bg-floodlight/[0.04] text-floodlight/70 transition-colors hover:border-touchline/60 hover:text-touchline disabled:opacity-60 ${className}`}
      >
        {busy ? (
          <span className="h-3 w-3 animate-pulse rounded-full bg-touchline" />
        ) : (
          <ShareIcon size={14} />
        )}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleCast}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-sm bg-ink px-3 py-2 font-display tracking-broadcast text-sm uppercase text-chalk hover:bg-pitch-dark disabled:opacity-60 transition-colors"
      >
        <ShareIcon size={14} />
        <span>{busy ? "Casting…" : "Cast"}</span>
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-sm border border-ink/40 px-3 py-2 font-display tracking-broadcast text-xs uppercase text-ink hover:bg-ink/5 transition-colors"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
