import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' — чтобы сайт работал на GitHub Pages в подпапке репозитория
// В защищённой сборке (npm run build:protected) сайт запускается только на своих доменах
const protect = process.env.CND_PROTECT === '1';
const domains = (process.env.CND_DOMAINS || 'kiryxaurnsadik.github.io').split(',').map((d) => d.trim()).filter(Boolean);

export default defineConfig({
  plugins: [react()],
  base: './',
  define: { __CND_DOMAINS__: JSON.stringify(protect ? [...domains, 'localhost', '127.0.0.1'] : null) },
  build: {
    sourcemap: false, // исходники не публикуем
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Библиотеки отдельно, чтобы запутывался (scripts/protect.mjs) только код самого сайта
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/three|skinview/.test(id)) return 'vendor-3d';
          if (/konva/.test(id)) return 'vendor-canvas';
          if (/supabase/.test(id)) return 'vendor-db';
          return 'vendor';
        },
      },
    },
  },
});
