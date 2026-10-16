import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const adminApiPort = Number(process.env.ADMIN_API_PORT || 8006);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5175,
    proxy: {
      '/api/admin': {
        target: `http://127.0.0.1:${adminApiPort}`,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8005',
        changeOrigin: true,
      },
      '/uploads': {
        target: `http://127.0.0.1:${process.env.ADMIN_USER_API_PORT || 8005}`,
        changeOrigin: true,
      }
    }
  }
});
