/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        app: "#F4F6F5",
        surface: "#FFFFFF",
        ink: "#0E1512",
        "ink-soft": "#5C6B63",
        border: "#E3E8E5",
        "border-strong": "#CBD3CE",
        credit: "#1F6F4A",
        "credit-soft": "#E7F0EA",
        debit: "#B54708",
        "debit-soft": "#FBEDE2",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};
