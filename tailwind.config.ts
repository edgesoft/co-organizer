import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'xxs': '0.625rem', // 10px (förutsatt att 1rem = 16px)
      },
    },
  },
  plugins: [],
} satisfies Config