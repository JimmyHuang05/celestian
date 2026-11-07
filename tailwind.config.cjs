/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        stoneBg: '#1c1917',
        stoneCard: '#292524',
        stoneBorder: '#44403c',
        gold: {
          DEFAULT: '#d4b58e',
          dim: '#8c7355',
          glow: 'rgba(212, 181, 142, 0.15)',
        },
      },
      fontFamily: {
        sans: ['var(--font-ui)'],
        serif: ['var(--font-body)'],
        'serif-sc': ['var(--font-body)'],
        mono: ['var(--font-mono)'],
        'mono-ef': ['var(--font-mono)'],
        yishan: ['var(--font-decorative)'],
        cinzel: ['var(--font-display)'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
