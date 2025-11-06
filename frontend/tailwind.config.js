/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00d4ff',
        secondary: '#00ff88',
        dark: '#0a0a0a',
        darker: '#050505',
        card: '#1a1a1a',
        border: '#333',
      }
    },
  },
  plugins: [],
}
