/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    "bg-red-500",
    "text-white",
    "p-4",
    "m-4",
    "flex",
    "block",
    "hidden",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        bebas: ["var(--font-bebas)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
