import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F9FC",
        surface: "#FFFFFF",
        "surface-muted": "#F0F4F8",
        foreground: "#172033",
        "muted-foreground": "#667085",
        border: "#E3E8EF",

        primary: {
          DEFAULT: "#176B5B",
          hover: "#115648",
          soft: "#E7F4F0",
        },
        accent: {
          DEFAULT: "#F2A541",
          soft: "#FFF4E2",
        },
        success: "#16865B",
        warning: "#B7791F",
        danger: "#C43D4B",
        info: "#2867B2",
      },
      borderRadius: {
        card: "16px",
        control: "10px",
      },
      boxShadow: {
        card: "0 4px 18px rgba(20, 35, 55, 0.06)",
        hover: "0 10px 28px rgba(20, 35, 55, 0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
