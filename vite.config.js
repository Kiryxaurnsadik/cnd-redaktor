// Если крадёте, то крадите ради реально хороших людей
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const protect = process.env.CND_PROTECT === '1';
const domains = (process.env.CND_DOMAINS || 'kiryxaurnsadik.github.io').split(',').map((d) => d.trim()).filter(Boolean);

export default defineConfig({
  plugins: [react()],
  base: './',
  define: { __CND_DOMAINS__: JSON.stringify(protect ? [...domains, 'localhost', '127.0.0.1'] : null) },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/three|skinview/.test(id)) return 'vendor-3d';
          if (/konva/.test(id)) return 'vendor-canvas';
          if (/supabase/.test(id)) return 'vendor-db';
          if (/ag-psd/.test(id)) return 'lib-psd';
          if (/pdfjs-dist/.test(id)) return 'lib-pdf';
          if (/node_modules\/(mammoth|jszip|pako|bluebird|underscore|lop|xmlbuilder|dingbat-to-unicode|base64-js|@xmldom|option|argparse|sax|readable-stream|setimmediate|lie|immediate|inherits|util-deprecate|core-util-is|process-nextick-args|safe-buffer|string_decoder|isarray)\//.test(id)) return 'lib-docx';
          return 'vendor';
        },
      },
    },
  },
});
