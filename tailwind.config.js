/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ice-blue': '#CEE5F2',      // 最浅的蓝色
        'sky-blue': '#8DBDDF',      // 第二个蓝色
        'slate-blue': '#7C98B3',    // 第三个蓝色
        'navy-blue': '#3B5373',     // 深蓝色
        'royal-purple': '#AB69A8',  // 紫色
      }
    },
  },
  plugins: [],
} as Config
