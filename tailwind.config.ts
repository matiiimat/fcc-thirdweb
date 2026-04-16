import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#0b6b2e",
          dark: "#073d1a",
          line: "#1e8a42",
          deep: "#052614",
        },
        floodlight: "#f5f3e8",
        chalk: "#ffffff",
        touchline: "#e6b422",
        blood: "#c1272d",
        sky: "#6bb8ff",
        ink: "#0b0d0f",
        paper: "#f0ece1",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "turf-stripes":
          "repeating-linear-gradient(90deg, rgba(11,107,46,0.18) 0 40px, rgba(7,61,26,0.18) 40px 80px)",
      },
      letterSpacing: {
        broadcast: "0.08em",
      },
    },
  },
  plugins: [],
};
export default config;
