import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` is '/' for local dev/build and set to the repo subpath ('/GiftGiver/')
// in CI for GitHub Pages via the VITE_BASE env var.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})
