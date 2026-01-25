import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Set to match the port used in main app redirect
    strictPort: false // Allow fallback to next available port if 5174 is taken
  }
})
