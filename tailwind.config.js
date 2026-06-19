/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#CF0A0A",
        orange: "#DC5F00",
        gold: "#B8960C",
        dark: "#000000",
        light: "#EEEEEE",
      },
    },
  },
  plugins: [],
}