import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — laranja vibrante
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea6c0a",
          700: "#c2570a",
          800: "#9a3f07",
          900: "#7c3508",
          950: "#431a03",
        },
        // Surface — tons escuros
        surface: {
          900: "#0a0a0f",
          800: "#111118",
          700: "#18181f",
          600: "#1e1e28",
          500: "#252533",
          400: "#2d2d3f",
          300: "#3a3a50",
          200: "#4a4a66",
          100: "#6b6b8a",
          50: "#9b9bbb",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #f97316 0%, #ea6c0a 50%, #c2570a 100%)",
        "gradient-dark":
          "linear-gradient(180deg, #111118 0%, #0a0a0f 100%)",
        "gradient-card":
          "linear-gradient(135deg, #18181f 0%, #1e1e28 100%)",
      },
      boxShadow: {
        "brand-sm": "0 2px 8px rgba(249, 115, 22, 0.2)",
        "brand-md": "0 4px 16px rgba(249, 115, 22, 0.3)",
        "brand-lg": "0 8px 32px rgba(249, 115, 22, 0.4)",
        "card": "0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-brand": "pulseBrand 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseBrand: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
