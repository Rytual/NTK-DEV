/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'ninja-gray': '#0a0e27',
        'shadow-gray': '#1a1f3a',
        'emerald': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'Monaco', 'monospace']
      },
      boxShadow: {
        'ninja': '0 0 20px rgba(16, 185, 129, 0.3)',
        'ninja-lg': '0 0 40px rgba(16, 185, 129, 0.4)'
      },
      animation: {
        'shuriken': 'spin 1.2s linear infinite',
        'pulse-emerald': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
};
