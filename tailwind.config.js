/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0B0F19',
          800: '#0E1320',
          700: '#141A2A',
        },
        brand: {
          DEFAULT: '#4285F4',
          light: '#8AB4F8',
          violet: '#A78BFA',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        muted: '#A1A1AA',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #4285F4 0%, #8AB4F8 50%, #A78BFA 100%)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(66,133,244,0.45)',
        'glow-lg': '0 0 80px -10px rgba(138,180,248,0.5)',
        card: '0 8px 40px -12px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'mesh-drift': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(4%,-3%) scale(1.08)' },
          '66%': { transform: 'translate(-3%,4%) scale(0.96)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'mesh-drift': 'mesh-drift 18s ease-in-out infinite',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
