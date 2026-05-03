import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { execSync } from 'child_process'

const BUILD_HASH = execSync('git rev-parse HEAD').toString().trim().slice(0, 12)

export default defineConfig({
  define: {
    __BUILD_HASH__: JSON.stringify(BUILD_HASH),
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
