/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#2D5A3B',  // Vert Forêt Âne & Gorille
          gold: '#F4B400',   // Jaune d'Or
          dark: '#1F2937',   // Noir Doux
          light: '#F9FAFB',  // Écru de fond
        }
      }
    }
  },
  plugins: [],
}
