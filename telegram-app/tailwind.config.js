/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand — Cherry Sushi
        cherry: {
          DEFAULT: '#E11D2A',
          50: '#FFF1F2',
          400: '#F43F4B',
          500: '#E11D2A',
          600: '#C4121F',
          700: '#9E0E19',
        },
        gold: '#F5B301',
        // Dark surface system (driven by CSS vars → adapts to TG theme)
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        elevated: 'var(--elevated)',
        line: 'var(--line)',
        ink: 'var(--ink)',
        'ink-dim': 'var(--ink-dim)',
        'ink-faint': 'var(--ink-faint)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 6px 20px -8px rgba(0,0,0,0.45)',
        glow: '0 8px 30px -6px rgba(225,29,42,0.45)',
        'glow-green': '0 8px 30px -6px rgba(34,197,94,0.4)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'pop-in': 'pop-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
