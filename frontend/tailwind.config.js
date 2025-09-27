/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f5ff',
        'neon-purple': '#ff00ff',
        'neon-cyan': '#00ffff',
        'neon-pink': '#ff1493',
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite alternate',
        'particle-float': 'particleFloat 6s ease-in-out infinite',
        'logo-bounce': 'logoBounce 2s ease-in-out infinite',
        'navbar-fade': 'navbarFade 0.5s ease-out',
        'pop': 'pop 0.3s ease-out',
      },
      keyframes: {
        neonPulse: {
          '0%': { boxShadow: '0 0 5px #00f5ff, 0 0 10px #00f5ff, 0 0 15px #00f5ff' },
          '100%': { boxShadow: '0 0 10px #00f5ff, 0 0 20px #00f5ff, 0 0 30px #00f5ff' },
        },
        particleFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)', opacity: '0.7' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)', opacity: '1' },
        },
        logoBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        navbarFade: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      fontFamily: {
        'anime': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'anime': '0 4px 20px rgba(0, 245, 255, 0.15)',
        'neon': '0 0 20px rgba(0, 245, 255, 0.5)',
      },
    },
  },
  plugins: [],
}
