import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Build para produção: arquivos vão para backend/src/static
    outDir: '../backend/src/static',
    emptyOutDir: true,
    // Otimizações de build
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  server: {
    host: true, // Permite acesso externo
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'formfitting-rosana-incombustibly.ngrok-free.dev', // Seu domínio ngrok específico
      '.ngrok-free.dev', // Permite qualquer subdomínio ngrok
      '.ngrok.io', // Para contas pagas do ngrok
    ],
    cors: true, // Habilita CORS
  },
})
