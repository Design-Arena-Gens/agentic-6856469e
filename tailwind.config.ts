import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1b7cff',
        accent: '#ff9f43'
      },
      boxShadow: {
        smart: '0 20px 45px -20px rgba(27, 124, 255, 0.45)'
      }
    }
  },
  plugins: []
};

export default config;
