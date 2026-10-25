/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          500: '#10b981',
          600: '#059669',
        },
        edu: {
          lime: '#d8fa55',
          'lime-light': '#ecfccb',
          'lime-dark': '#b7e436',
          dark: '#171822',
          'dark-card': '#1c1e2b',
          'dark-hover': '#242738',
          text: '#171821',
          muted: '#8e93a6',
          bg: '#f8f9fb',
          border: '#edf0f5',
          peach: '#ffedd5',
          orange: '#ea580c',
          lavender: '#ede9fe',
          purple: '#7c3aed',
        },
        surface: {
          900: '#0b0f19',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
        }
      }
    },
  },
  plugins: [],
}
