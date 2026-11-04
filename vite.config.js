import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' — чтобы сайт работал на GitHub Pages в подпапке репозитория
export default defineConfig({
  plugins: [react()],
  base: './',
});
