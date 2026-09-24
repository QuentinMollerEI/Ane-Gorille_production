import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  // Ajout de l'optimisation pour la production
  build: {
    target: 'esnext',
    minify: 'esbuild',
    // Retire automatiquement les console.log et debugger du code en production
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  esbuild: {
    // Alternative plus rapide pour esbuild
    drop: ['console', 'debugger'],
  }
})