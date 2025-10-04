/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#14B8A6',      // Teal / Cyan-vert
          red: '#FF4040',        // Coral Red
          black: '#2A3439',      // Dark Gray / Gunmetal Gray
        },
      },
      borderRadius: {
        '50': '50%',
      },
      fontFamily: {
        roboto: ['Roboto', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

