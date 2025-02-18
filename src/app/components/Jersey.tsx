"use client";

import { IJersey } from "../models/Team";

interface JerseyProps {
  jersey?: IJersey;
  size?: "small" | "medium" | "large";
}

const defaultJersey: IJersey = {
  primaryColor: "#ffffff",
  secondaryColor: "#000000",
  pattern: "solid",
  sponsorLogoUrl: "",
};

export default function Jersey({
  jersey = defaultJersey,
  size = "small",
}: JerseyProps) {
  const dimensions = {
    small: "w-6 h-8",
    medium: "w-12 h-16",
    large: "w-32 h-40",
  };

  return (
    <div className={`${dimensions[size]} relative`}>
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <defs>
          {jersey.pattern === "stripes" && (
            <pattern
              id={`stripes-${size}`}
              patternUnits="userSpaceOnUse"
              width="20"
              height="20"
              patternTransform="rotate(0)"
            >
              <rect width="10" height="20" fill={jersey.primaryColor} />
              <rect
                x="10"
                width="10"
                height="20"
                fill={jersey.secondaryColor}
              />
            </pattern>
          )}
          {jersey.pattern === "halves" && (
            <linearGradient
              id={`halves-${size}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="50%" style={{ stopColor: jersey.primaryColor }} />
              <stop offset="50%" style={{ stopColor: jersey.secondaryColor }} />
            </linearGradient>
          )}
          {jersey.pattern === "quarters" && (
            <pattern
              id={`quarters-${size}`}
              patternUnits="userSpaceOnUse"
              width="100"
              height="120"
            >
              <rect width="50" height="60" fill={jersey.primaryColor} />
              <rect
                x="50"
                width="50"
                height="60"
                fill={jersey.secondaryColor}
              />
              <rect
                y="60"
                width="50"
                height="60"
                fill={jersey.secondaryColor}
              />
              <rect
                x="50"
                y="60"
                width="50"
                height="60"
                fill={jersey.primaryColor}
              />
            </pattern>
          )}
          {jersey.sponsorLogoUrl && (
            <pattern
              id={`sponsorLogo-${size}`}
              patternUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <image
                href={jersey.sponsorLogoUrl}
                width="30"
                height="30"
                preserveAspectRatio="xMidYMid meet"
              />
            </pattern>
          )}
        </defs>

        {/* Jersey shape */}
        <path
          d="M20,0 h60 a10,10 0 0 1 10,10 v80 a20,20 0 0 1 -20,20 h-40 a20,20 0 0 1 -20,-20 v-80 a10,10 0 0 1 10,-10"
          fill={
            jersey.pattern === "solid"
              ? jersey.primaryColor
              : jersey.pattern === "stripes"
              ? `url(#stripes-${size})`
              : jersey.pattern === "halves"
              ? `url(#halves-${size})`
              : `url(#quarters-${size})`
          }
          stroke="#000"
          strokeWidth="2"
        />

        {/* Collar */}
        <path d="M40,0 v10 h20 v-10" fill="#000" />

        {/* Logo placeholder */}
        <circle
          cx="50"
          cy="40"
          r="15"
          fill={jersey.sponsorLogoUrl ? `url(#sponsorLogo-${size})` : "#666"}
        />
      </svg>
    </div>
  );
}
