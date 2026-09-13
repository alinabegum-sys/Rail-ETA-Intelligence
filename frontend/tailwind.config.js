/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rail: {
          900: '#0b1329',
          800: '#111e38',
          700: '#1d2f54',
          600: '#2c4270',
          blue: '#1e40af',
          amber: '#d97706',
          crimson: '#dc2626',
          emerald: '#059669',
          cyan: '#0891b2'
        }
      }
    },
  },
  plugins: [],
}
