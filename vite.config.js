import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { execSync } from 'child_process'
import oldPreview from './scripts/old-preview.js'

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

function getBuildDate() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

// The public gallery is served by the same API used in production.
// Restrict the development proxy to this read-only endpoint.
const galleryProxy = {
  '/api/entries/node/gallery': {
    target: 'https://celestian.jimmyhuang.cn',
    changeOrigin: true,
    secure: true,
    bypass(req, res) {
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.statusCode = 405
        res.end('Method not allowed')
        return false
      }
    },
  },
}

export default defineConfig({
  server: { proxy: galleryProxy },
  preview: { proxy: galleryProxy },
  build: { rollupOptions: { input: { main: 'index.html', characters: 'character-profile.html' } } },
  define: {
    __BUILD_INFO__: JSON.stringify({
      commit: getGitCommit(),
      branch: getGitBranch(),
      date: getBuildDate(),
      env: 'production',
    }),
  },
  plugins: [
    oldPreview(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
