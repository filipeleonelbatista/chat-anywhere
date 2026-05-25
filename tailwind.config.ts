import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: "#25D366",
          "green-dark": "#128C7E",
          "green-darker": "#075E54",
          bg: "#E5DDD5",
          "bg-dark": "#111B21",
          bubble: "#DCF8C6",
          "bubble-own": "#DCF8C6",
          "bubble-other": "#FFFFFF",
          header: "#075E54",
          input: "#F0F2F5",
        },
      },
    },
  },
  plugins: [],
};
export default config;
