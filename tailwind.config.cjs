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
        sans: ['Noto Serif CJK', 'serif'],
        serif: ['Noto Serif CJK', 'serif'],
        yishan: ['峄山碑篆体', 'serif'],
        cinzel: ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
