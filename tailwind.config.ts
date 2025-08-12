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
        background: '#F6F5F3',
        primary: '#6C63FF',
        accent: {
          green: '#4BB543',
          yellow: '#FFB84C',
        },
        text: '#2B2B2B',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)'],
        inter: ['var(--font-inter)'],
      },
    },
  },
  plugins: [],
};
export default config;
