import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const here = fileURLToPath(new URL('.', import.meta.url))
export default defineConfig({
  root: here,
  base: '/old/',
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss({ config: here + 'tailwind.config.cjs' }), autoprefixer()] } },
  define: { __BUILD_INFO__: JSON.stringify({ updatedAt: '改版前存档', env: 'archive' }) },
  build: { outDir: '../public/old', emptyOutDir: false },
})
