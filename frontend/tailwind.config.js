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
        "ink-faint": "#8A948E",
        border: "#E3E8E5",
        "border-strong": "#CBD3CE",
        credit: "#1F6F4A",
        "credit-soft": "#E7F0EA",
        debit: "#B54708",
        "debit-soft": "#FBEDE2",
        accent: "#16321F",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(14, 21, 18, 0.04), 0 1px 8px rgba(14, 21, 18, 0.04)",
        elevated: "0 4px 16px rgba(14, 21, 18, 0.08), 0 1px 3px rgba(14, 21, 18, 0.06)",
      },
    },
  },
  plugins: [],
};
