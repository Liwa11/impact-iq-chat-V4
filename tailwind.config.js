/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          impactTurquoise: "#20c5c9", // Impact IQ accent color
          iqgreen: {
            light: "#6EE7B7", // zachte tint
            DEFAULT: "#10B981", // accentkleur
            dark: "#047857", // donkere variant
          },
          iqgray: {
            light: "#F3F4F6",
            DEFAULT: "#D1D5DB",
            dark: "#4B5563",
          },
        },
        fontFamily: {
          sans: ["Inter", "sans-serif"],
        },
        backgroundImage: {
          'iq-gradient': 'linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))',
        },
      },
    },
    plugins: [],
  }