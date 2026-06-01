/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#1e293b',
          board: '#334155',
          accent: '#38bdf8',
        }
      }
    },
  },
  plugins: [],
}