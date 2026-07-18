/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#111318',
        s1: '#181C24',
        s2: '#1F242F',
        s3: '#272D3A',
        amber: '#F5A623',
        coral: '#FF5C38',
        green: '#22C55E',
        red: '#EF4444',
        cream: '#F0EAD6',
        white: '#F4F6FA',
        muted: 'rgba(244,246,250,0.42)',
        border: 'rgba(255,255,255,0.07)',
      },
      borderRadius: {
        'r': '14px',
        'rsm': '8px',
      },
      fontFamily: {
        inter: ['Inter', '-apple-system', 'sans-serif'],
      },
      animation: {
        rowIn: 'rowIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        dotPulse: 'dotPulse 1.2s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        cardFlip: 'cardFlip 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        pulseCustom: 'pulseCustom 2s ease-in-out infinite',
        scoreIn: 'scoreIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        slideIn: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        dropIn: 'dropIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        fall: 'fall 1.5s ease-out forwards',
        glowPulse: 'glowPulse 3s infinite',
        fadeUp: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        rowIn: {
          '0%': { opacity: '0', transform: 'translateX(15px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(0.5)', opacity: '0.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0)', opacity: '1' },
        },
        pulseCustom: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        scoreIn: {
          '0%': { opacity: '0', transform: 'scale(0.5) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dropIn: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fall: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        reactionPop: {
          from: { opacity: 0, transform: 'scale(0.3)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
