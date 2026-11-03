import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: false,
      includeAssets: ['manifest.json', 'apple-touch-icon.png', 'favicon.svg'],
      registerType: 'autoUpdate',
    }),
  ],
})
