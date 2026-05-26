/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ff8c00",
          dark: "#e67e00",
          light: "#ffa733",
        },
        dark: {
          DEFAULT: "#1a1d2e",
          lighter: "#252837",
          card: "#1e2139",
        },
        accent: {
          blue: "#4a90e2",
          green: "#2ecc71",
          purple: "#9b59b6",
          orange: "#ff8c00",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
