import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development, /api is proxied to the local Express server.
// In production (Vercel), the app calls VITE_API_URL directly (your Render URL).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
