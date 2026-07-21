/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          rose: "#F43F5E",
          blue: "#3B82F6",
          green: "#22C55E",
        },
        primary: "#0EA5E9",
        verdict: {
          trust: "#22C55E",
          dont_trust: "#EF4444",
          verify_first: "#F59E0B",
        },
        surface: {
          dark: { bg: "#0B0F14", card: "#151A21", border: "#232A33", text: "#E5E9F0" },
          light: { bg: "#F7F8FA", card: "#FFFFFF", border: "#E4E7EC", text: "#111827" },
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #F43F5E 0%, #3B82F6 50%, #22C55E 100%)",
      },
    },
  },
  plugins: [],
};
