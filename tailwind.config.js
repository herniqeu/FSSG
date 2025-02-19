/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        lora: ['Lora', 'serif'],
      },
      colors: {
        background: "#F5F2EA",
        foreground: "#1A1A1A",
        muted: "rgba(0, 0, 0, 0.1)",
        primary: "#1A1A1A",
        border: "rgba(0, 0, 0, 0.1)"
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards'
      }
    },
  },
  plugins: [],
};