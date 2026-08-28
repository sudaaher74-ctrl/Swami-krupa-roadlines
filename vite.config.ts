import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensure relative paths for GitHub Pages and web hosting
  server: {
    port: 5174,
    host: true,
  },
})
