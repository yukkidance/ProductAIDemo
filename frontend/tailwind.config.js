/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0e1a",
          card: "#111827",
          elevated: "#1a2035",
        },
        border: {
          DEFAULT: "#1f2937",
          strong: "#374151",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        accent: {
          purple: "#8b5cf6",
          pink: "#a855f7",
          cyan: "#22d3ee",
          green: "#10b981",
          orange: "#f59e0b",
        },
        text: {
          primary: "#e5e7eb",
          secondary: "#9ca3af",
          muted: "#6b7280",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        "gradient-cyan": "linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)",
        "grid": "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-brand": "0 0 30px rgba(99, 102, 241, 0.3)",
        "glow-cyan": "0 0 30px rgba(34, 211, 238, 0.3)",
        "glow-purple": "0 0 30px rgba(168, 85, 247, 0.3)",
      },
      animation: {
        "gradient-shift": "gradient-shift 6s ease infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
