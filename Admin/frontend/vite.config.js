import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5175,
    proxy: {
      '/api/admin': {
        target: 'http://localhost:8006',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8005',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8005',
        changeOrigin: true,
      }
    }
  }
});
