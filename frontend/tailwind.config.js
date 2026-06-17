/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#B8860B',
        secondary: '#008080',
        'btn-grey': '#6B7280',
      }
    },
  },
  plugins: [],
}

