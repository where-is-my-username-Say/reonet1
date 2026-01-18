/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        primary: "#00f2ff",
        secondary: "#7000ff",
        accent: "#ff00d9",
      },
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 242, 255, 0.5), 0 0 20px rgba(0, 242, 255, 0.2)',
        'neon-hover': '0 0 20px rgba(0, 242, 255, 0.8), 0 0 40px rgba(0, 242, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
