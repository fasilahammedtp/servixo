/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#16302B", // Deep Forest Green
        accent: "#C5A880", // Soft Gold/Champagne
      },
    },
  },
  plugins: [],
};
