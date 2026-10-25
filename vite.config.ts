import { defineConfig } from 'vite';

// `base: './'` keeps every link relative, so the site works on GitHub Pages under /foto-site/
// and on a custom domain without a rebuild.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 0 },
  server: { host: '127.0.0.1', port: 5310, strictPort: true },
  preview: { host: '127.0.0.1', port: 5311, strictPort: true },
});
