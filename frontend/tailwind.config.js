/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161512",
        paper: "#E9E2D0",
        textOnInk: "#E7E2D8",
        textOnPaper: "#241F19",
        steel: "#5B7C99",
        amber: "#C98A3D",
        thread: "#8B4B3B",
        teal: "#3E6E5E",
        hairline: "#26241F"
      },
      fontFamily: {
        chrome: ["'Space Grotesk'", "sans-serif"],
        editorial: ["'Source Serif 4'", "serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      }
    }
  },
  plugins: []
}
