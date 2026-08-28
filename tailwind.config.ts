import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f0f7f4",
          100: "#dceee5",
          200: "#b8dccb",
          300: "#88c3aa",
          400: "#57a484",
          500: "#3a8869",
          600: "#2b6d54",
          700: "#245745",
          800: "#1f4639",
          900: "#0f4c3a",
          950: "#0c1612",
        },
        gold: {
          50: "#fbf8f0",
          100: "#f4ecd6",
          200: "#e8d6a8",
          300: "#d4b96e",
          400: "#c4a35a",
          500: "#b0893c",
          600: "#966e30",
          700: "#785428",
          800: "#644526",
          900: "#563b24",
        },
        paper: {
          50: "#fdfcfa",
          100: "#f7f4ef",
          200: "#efe8dc",
          300: "#e2d5c3",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 76, 58, 0.06), 0 8px 24px rgba(15, 76, 58, 0.06)",
        "card-dark": "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
