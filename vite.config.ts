import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PWA plugin will be configured in Phase 6
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({ ... }) - configured in Phase 6
  ],
})

