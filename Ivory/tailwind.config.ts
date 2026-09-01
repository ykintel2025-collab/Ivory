import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          high: "#dc2626",
          medium: "#ea580c",
          low: "#16a34a",
        },
        status: {
          open: "#dc2626",
          progress: "#ea580c",
          done: "#16a34a",
          blocked: "#6b7280",
        },
      },
    },
  },
  plugins: [],
};
export default config;
