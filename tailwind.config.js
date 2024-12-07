/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'moss-green': '#809848',
        'charcoal': '#444554',
        'rose-quartz': '#A68BA5',
        'light-sky-blue': '#97C8EB',
      },
      fontFamily: {
        bitmap: ['VonwaonBitmap', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
