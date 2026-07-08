module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#0f172a",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#334155",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
        },
        background: "#f8fafc", // slate-50
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f1f5f9", // slate-100
        },
        foreground: "#0f172a",
        text: {
          DEFAULT: "#0f172a",
          muted: "#64748b", // slate-500
        },
        border: "#e2e8f0", // slate-200
      },
    },
  },
  plugins: [],
}
