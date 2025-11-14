/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06206f',
          hover: '#041952',
          light: '#7b8cff',
        },
      },
    },
  },
  plugins: [],
};
