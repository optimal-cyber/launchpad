import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#0B0D0E", // canvas
          800: "#14181B",
          700: "#1F2529",
          600: "#2A3238",
          500: "#0F1113", // header / footer
          400: "#2E2E2E",
          300: "#5A5F63",
          200: "#9AA1A6",
          100: "#E5E7EB",
          50:  "#F6F7F8",
        },
        accent: { 500: "var(--accent, #38BDF8)" } // swap later if needed
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      }
    },
  },
  plugins: [],
};

export default config;
