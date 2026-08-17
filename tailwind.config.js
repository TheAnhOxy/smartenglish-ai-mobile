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
        primary: "#0EA5E9",        // Soft Sky Blue
        primaryDark: "#0284C7",    // Deep Sky Blue
        secondary: "#1E3A5F",      // Navy Blue
        accent: "#38BDF8",         // Light Blue Accent
        success: "#2ECC71",        // Leaf Green
        error: "#FF4D4D",          // Coral Red
        warning: "#FFA726",        // Amber
        neutralInk: "#1A1D29",     // Text Main
        neutralGray: "#6B7280",    // Text Sub
        surface: "#F0F7FF",        // App Background Soft Light Blue
        cardWhite: "#FFFFFF",      // Card Background Light
        darkBg: "#12141C",         // Dark BG
        darkCard: "#1E212C",       // Dark Mode Card
        // SRS Specific Colors
        srsAgain: "#FF4D4D",
        srsHard: "#FFA726",
        srsGood: "#2ECC71",
        srsEasy: "#0EA5E9",
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