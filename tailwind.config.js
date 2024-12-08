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
        'charcoal': '#2C3E50',      // 深灰色
        'moss-green': '#3D9970',    // 原有的绿色
        'rose-quartz': '#E8A4C9',   // 玫瑰石英色
        'sage': '#87AE73',          // 鼠尾草绿
        'amber': '#D4A256',         // 调整：更深的琥珀色
        'coral': '#B85F51',         // 调整：更深的珊瑚色
      }
    },
  },
  plugins: [],
} as Config
