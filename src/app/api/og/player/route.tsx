/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * /api/og/player — FUT-style player card rendered as an OG image.
 *
 * Layout: 1200×630, Farcaster-frame friendly. Vertical FUT card on the
 * left with a 6-stat grid; name + traits + branding on the right.
 * Tier (gold / silver / bronze) derived from overall rating.
 *
 * Query params (all optional, all safe defaults):
 *   name, username, pos, rating, team, primary, secondary, traits, pfp
 *   str, sta, pas, sho, def, spe, pos_stat, we
 *
 * Example:
 *   /api/og/player?name=Ochoa&pos=F&rating=82&sho=16&spe=15&team=Ironclad+FC
 */

const WIDTH = 1200;
const HEIGHT = 630;

type CoreStats = {
  strength: number;
  stamina: number;
  passing: number;
  shooting: number;
  defending: number;
  speed: number;
  positioning: number;
  workEthic: number;
};

function mapToFutStats(s: CoreStats) {
  const toFut = (v: number) =>
    Math.round(40 + (Math.max(0, Math.min(20, v)) / 20) * 59);
  return [
    { label: "PAC", value: toFut(s.speed) },
    { label: "SHO", value: toFut(s.shooting) },
    { label: "PAS", value: toFut(s.passing) },
    { label: "DRI", value: toFut((s.positioning + s.speed) / 2) },
    { label: "DEF", value: toFut(s.defending) },
    { label: "PHY", value: toFut((s.strength + s.stamina) / 2) },
  ];
}

function tierFor(rating: number) {
  if (rating >= 80) {
    return {
      name: "GOLD",
      accent: "#e6b422",
      accentLight: "#f5d872",
      accentDark: "#b8881a",
      text: "#1a1405",
      deep: "#3a2a05",
    };
  }
  if (rating >= 65) {
    return {
      name: "SILVER",
      accent: "#c5cbd1",
      accentLight: "#eef2f5",
      accentDark: "#7f858c",
      text: "#0f1114",
      deep: "#2a2d33",
    };
  }
  return {
    name: "BRONZE",
    accent: "#c9915e",
    accentLight: "#e0a977",
    accentDark: "#6a3f17",
    text: "#1a0f06",
    deep: "#3a210e",
  };
}

function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function parseNum(v: string | null, fallback = 0): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const name = (searchParams.get("name") || "PLAYER").slice(0, 20);
    const username = (searchParams.get("username") || "").slice(0, 20);
    const position = (searchParams.get("pos") || "M").toUpperCase().slice(0, 3);
    const team = (searchParams.get("team") || "FREE AGENT").slice(0, 28);
    const rating = Math.round(
      Math.max(40, Math.min(99, parseNum(searchParams.get("rating"), 65)))
    );
    const primary = searchParams.get("primary") || "#0b6b2e";
    const secondary = searchParams.get("secondary") || "#f5f3e8";
    const traits = (searchParams.get("traits") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);

    const stats: CoreStats = {
      strength: parseNum(searchParams.get("str"), 10),
      stamina: parseNum(searchParams.get("sta"), 10),
      passing: parseNum(searchParams.get("pas"), 10),
      shooting: parseNum(searchParams.get("sho"), 10),
      defending: parseNum(searchParams.get("def"), 10),
      speed: parseNum(searchParams.get("spe"), 10),
      positioning: parseNum(searchParams.get("pos_stat"), 10),
      workEthic: parseNum(searchParams.get("we"), 10),
    };

    const futStats = mapToFutStats(stats);
    const tier = tierFor(rating);
    const initials = initialsOf(name);

    return new ImageResponse(
      (
        <div
          style={{
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #041b0d 0%, #000000 100%)",
            fontFamily: "Impact, sans-serif",
          }}
        >
          {/* Left: FUT card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 420,
              height: 560,
              marginLeft: 60,
              marginRight: 40,
              borderRadius: 24,
              padding: 4,
              background: `linear-gradient(135deg, ${tier.accent} 0%, ${tier.accentLight} 40%, ${tier.accentDark} 100%)`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                borderRadius: 20,
                background: `linear-gradient(180deg, ${tier.accent} 0%, ${tier.deep} 55%, ${tier.deep} 100%)`,
                color: tier.text,
                padding: "22px 26px",
                position: "relative",
              }}
            >
              {/* Rating + position */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 0.9,
                }}
              >
                <div style={{ fontSize: 118, fontWeight: 700, display: "flex" }}>
                  {rating}
                </div>
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    letterSpacing: 4,
                    marginTop: 4,
                    opacity: 0.85,
                    display: "flex",
                  }}
                >
                  {position}
                </div>
              </div>

              {/* Initials crest */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "absolute",
                  top: 22,
                  right: 22,
                  width: 150,
                  height: 150,
                  borderRadius: 9999,
                  background: primary,
                  border: `4px solid ${secondary}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 66,
                    color: secondary,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {initials}
                </div>
              </div>

              {/* Name band */}
              <div
                style={{
                  display: "flex",
                  marginTop: 30,
                  paddingTop: 14,
                  paddingBottom: 6,
                  borderTop: `2px solid ${tier.text}`,
                  borderBottom: `2px solid ${tier.text}`,
                  fontSize: 44,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {name.toUpperCase().slice(0, 14)}
              </div>

              {/* Stats 3×2 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 14,
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 34,
                      fontWeight: 700,
                      lineHeight: 1.1,
                    }}
                  >
                    <div style={{ display: "flex" }}>
                      <div
                        style={{
                          display: "flex",
                          width: 80,
                          fontWeight: 700,
                        }}
                      >
                        {futStats[row * 2].value}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          opacity: 0.8,
                          letterSpacing: 3,
                          marginLeft: 12,
                        }}
                      >
                        {futStats[row * 2].label}
                      </div>
                    </div>
                    <div style={{ display: "flex" }}>
                      <div
                        style={{
                          display: "flex",
                          width: 80,
                          fontWeight: 700,
                        }}
                      >
                        {futStats[row * 2 + 1].value}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          opacity: 0.8,
                          letterSpacing: 3,
                          marginLeft: 12,
                        }}
                      >
                        {futStats[row * 2 + 1].label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Team footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontSize: 20,
                  letterSpacing: 4,
                  opacity: 0.8,
                  marginTop: 8,
                  textTransform: "uppercase",
                }}
              >
                {team}
              </div>
            </div>
          </div>

          {/* Right: name + pills + traits + branding */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              height: 560,
              marginRight: 60,
              color: "#f5f3e8",
              justifyContent: "space-between",
            }}
          >
            {/* Top block */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  letterSpacing: 4,
                  color: "#6bb8ff",
                  textTransform: "uppercase",
                }}
              >
                fcc/FC · Player Card
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 88,
                  lineHeight: 0.95,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginTop: 10,
                }}
              >
                {name.toUpperCase()}
              </div>
              {username ? (
                <div
                  style={{
                    display: "flex",
                    fontSize: 28,
                    color: "#6bb8ff",
                    marginTop: 4,
                    letterSpacing: 2,
                  }}
                >
                  @{username}
                </div>
              ) : null}

              {/* Pills row */}
              <div
                style={{
                  display: "flex",
                  marginTop: 28,
                  fontSize: 26,
                  letterSpacing: 3,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    padding: "6px 16px",
                    background: "#0b6b2e",
                    color: "#ffffff",
                    borderRadius: 4,
                    marginRight: 16,
                  }}
                >
                  {position}
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "6px 16px",
                    background: tier.accent,
                    color: tier.text,
                    borderRadius: 4,
                    marginRight: 16,
                  }}
                >
                  {tier.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: "6px 16px",
                    border: "2px solid rgba(245,243,232,0.25)",
                    color: "#f5f3e8",
                    borderRadius: 4,
                  }}
                >
                  OVR {rating}
                </div>
              </div>
            </div>

            {/* Traits */}
            {traits.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 16,
                    letterSpacing: 4,
                    color: "rgba(245,243,232,0.55)",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Traits
                </div>
                <div style={{ display: "flex" }}>
                  {traits.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        fontSize: 22,
                        padding: "6px 14px",
                        background: "rgba(245,243,232,0.08)",
                        border: "1px solid rgba(245,243,232,0.25)",
                        color: "#f5f3e8",
                        letterSpacing: 2,
                        borderRadius: 4,
                        textTransform: "uppercase",
                        marginRight: 10,
                      }}
                    >
                      {t.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Branding footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 18,
                letterSpacing: 4,
                color: "rgba(245,243,232,0.45)",
                textTransform: "uppercase",
                paddingTop: 18,
                borderTop: "1px solid rgba(245,243,232,0.12)",
              }}
            >
              <div style={{ display: "flex" }}>fcc/FC</div>
              <div style={{ display: "flex" }}>Play the Frame</div>
            </div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[og/player] render failed:", message, err);
    return NextResponse.json(
      { error: "OG render failed", message },
      { status: 500 }
    );
  }
}
