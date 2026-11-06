import { defineConfig } from 'vite';

// Relative base so the same build works locally, in preview and on GitHub Pages (/ghost-post/).
export default defineConfig({
  base: './',
  server: { host: true },
  test: {
    include: ['test/**/*.test.js'],
  },
});
