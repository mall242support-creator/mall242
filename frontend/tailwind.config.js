/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bahamas': {
          aqua: '#00A9B0',
          gold: '#FFC72C',
          black: '#000000',
          white: '#ffffff',
          navy: '#0B1120',
        },
        'primary': '#00A9B0',
        'secondary': '#FFC72C',
        'accent': '#00A9B0',
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'pulse-slow': 'pulse 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideIn: {
          from: {
            opacity: '0',
            transform: 'translateX(100%)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
      },
      borderRadius: {
        'card': '12px',
        'xl': '20px',
      },
      boxShadow: {
        'amazon': '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'amazon-lg': '0 4px 12px rgba(0,0,0,0.15)',
        'amazon-xl': '0 8px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}