/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "Inter Fallback", "sans-serif"],
        lexend: ["Lexend Deca", "Lexend Deca Fallback", "sans-serif"],
      },
      colors: {
        gray: {
          0: "rgb(255 255 255)",
          50: "rgb(250 250 250)",
          100: "rgb(241 241 241)",
          200: "rgb(227 227 227)",
          300: "rgb(223 223 223)",
          400: "rgb(146 146 146)",
          500: "rgb(102 102 102)",
          600: "rgb(72 72 72)",
          700: "rgb(51 51 51)",
          800: "rgb(34 34 34)",
          900: "rgb(17 17 17)",
          1000: "rgb(0 0 0)",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
