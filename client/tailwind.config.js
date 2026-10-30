/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#F5F7F4',
        ink: { DEFAULT: '#14211A', soft: '#4A5A50', faint: '#7C8B81' },
        leaf: { 50: '#EDF8F1', 100: '#D6F0DF', 200: '#B0E2C3', 500: '#27A35D', 600: '#1E8A4C', 700: '#176E3D', 800: '#145732' },
        protein: '#3B7DD8',
        carbs: '#E0A21B',
        fat: '#E0694A',
        water: '#3AA6D8',
        line: '#E3E8E2',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,33,26,.05), 0 4px 16px -6px rgba(20,33,26,.08)',
        lift: '0 8px 30px -10px rgba(20,33,26,.22)',
      },
    },
  },
  plugins: [],
};
