/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a192f',
          800: '#112240',
          700: '#233554',
        },
        cyan: {
          400: '#64ffda',
          500: '#00d4ff',
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        smartcity: {
          "primary": "#00d4ff",
          "secondary": "#0a192f",
          "accent": "#64ffda",
          "neutral": "#1e293b",
          "base-100": "#ffffff",
          "base-200": "#f1f5f9",
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#eab308",
          "error": "#ef4444",
        },
      },
    ],
  },
}
