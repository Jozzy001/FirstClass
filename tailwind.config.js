/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF8',
        'paper-2': '#F1F0EA',
        graphite: '#14171C',
        line: '#E6E3D9',
        cobalt: {
          DEFAULT: '#2451E0',
          deep: '#17348C',
          pale: '#E6ECFD'
        },
        flame: {
          DEFAULT: '#E0562A',
          pale: '#FBE7DE'
        },
        mint: {
          DEFAULT: '#0F9E72',
          pale: '#DEF3EA'
        },
        rose: {
          DEFAULT: '#D1315B',
          pale: '#FAE0E6'
        }
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
