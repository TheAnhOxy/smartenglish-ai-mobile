/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B35",        // Momentum Orange
        primaryDark: "#E85A2A",    // Pressed Orange
        secondary: "#0F7173",      // Deep Teal
        accent: "#FFC93C",         // Sunshine Yellow
        success: "#2ECC71",        // Leaf Green
        error: "#FF4D4D",          // Coral Red
        warning: "#FFA726",        // Amber
        neutralInk: "#1A1D29",     // Text Main
        neutralGray: "#6B7280",    // Text Sub
        surface: "#F7F5F2",        // App Background
        cardWhite: "#FFFFFF",      // Card Background Light
        darkBg: "#12141C",         // Speaking/Scan Dark BG
        darkCard: "#1E212C",       // Dark Mode Card
        // SRS Specific Colors
        srsAgain: "#FF4D4D",
        srsHard: "#FFA726",
        srsGood: "#2ECC71",
        srsEasy: "#0F7173",
        // League Colors
        leagueBronze: "#CD7F32",
        leagueSilver: "#C0C0C0",
        leagueGold: "#FFD700",
        leagueDiamond: "#B9F2FF"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["BeVietnamPro-ExtraBold", "sans-serif"]
      }
    }
  },
  plugins: []
};