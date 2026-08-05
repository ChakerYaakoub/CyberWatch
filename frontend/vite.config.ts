import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  // Single shared env: infrastructure/.env
  envDir: path.resolve(rootDir, '../infrastructure'),
  server: {
    port: 5173,
    open: true,
  },
})
