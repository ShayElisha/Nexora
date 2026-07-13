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
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
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
        ink: "#0B0F19",
        slate: "#F8FAFC",
        "tech-blue": "#2563EB",
        emerald: "#10B981",
        coral: "#F97316",
      },
      boxShadow: {
        "coral-glow": "0 0 24px rgba(249,115,22,0.35)",
        lift: "0 20px 40px -12px rgba(11,15,25,0.12)",
      },
    },
  },
};
