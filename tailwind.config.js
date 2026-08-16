/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5", // Electric Indigo
        emerald: "#10B981", // Neon Emerald (Streak/Correct)
        gold: "#F59E0B",    // Amber Gold (XP/Coins)
        danger: "#EF4444",  // Coral Red (IPA Error)
      },
    },
  },
  plugins: [],
};