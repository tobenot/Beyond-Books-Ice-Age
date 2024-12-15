import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('Build Config:', {
    mode,
    command,
    VITE_INCLUDE_START_PACK: env.VITE_INCLUDE_START_PACK
  })

  return {
    plugins: [react()],
    base: process.env.GITHUB_PAGES ? '/Beyond-Books-Ice-Age/' : './',
    build: {
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    define: {
      'import.meta.env.VITE_INCLUDE_START_PACK': JSON.stringify(env.VITE_INCLUDE_START_PACK)
    }
  }
})
