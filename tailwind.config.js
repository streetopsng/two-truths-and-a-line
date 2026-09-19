/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#EDEAE4',
        cream: '#FAF7F2',
        white: '#FFFFFF',
        orange: '#F5821F',
        orange2: '#E8710A',
        'orange-lo': '#FDE8D0',
        'orange-lo2': '#FDF0E4',
        black: '#1A1A1A',
        mid: '#555555',
        muted: '#999999',
        border: '#E0DBD4',
        red: '#E8334A',
        green: '#22A855',
        amber: '#F5821F',
        coral: '#E8710A',
      },
      borderRadius: {
        'r': '16px',
        'rsm': '10px',
      },
      fontFamily: {
        inter: ['Inter', '-apple-system', 'sans-serif'],
      },
      animation: {
        rowIn: 'rowIn 0.3s ease forwards',
        dotPulse: 'dotPulse 1.2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        pulseCustom: 'pulseCustom 2s ease-in-out infinite',
        scoreIn: 'scoreIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        slideIn: 'slideIn 0.3s ease forwards',
        dropIn: 'dropIn 0.5s ease forwards',
        fall: 'fall 1.2s ease-out forwards',
        fadeUp: 'fadeUp 0.35s ease forwards',
        blink: 'blink 1.2s ease-in-out infinite',
      },
      keyframes: {
        rowIn: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(0.5)', opacity: '0.4' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseCustom: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        scoreIn: {
          '0%': { opacity: '0', transform: 'scale(0.4)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dropIn: {
          '0%': { opacity: '0', transform: 'translateY(-24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fall: {
          '0%': { transform: 'translateY(-8px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(70px) rotate(360deg)', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      }
    },
  },
  plugins: [],
}
