/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
