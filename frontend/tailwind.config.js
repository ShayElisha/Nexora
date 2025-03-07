/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
      },
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        bg: "var(--bg-color)",
        text: "var(--text-color)",
        "button-bg": "var(--button-bg)",
        "button-text": "var(--button-text)",
        "border-color": "var(--border-color)",
      },
    },
  },
};
