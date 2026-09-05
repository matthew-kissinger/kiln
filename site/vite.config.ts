import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Fast Refresh in development; without it every edit is a full reload and the
  // camera you just orbited to snaps back.
  plugins: [react()],
  // Relative, so the same build serves correctly from a custom domain at the
  // root and from a project page under `/kiln/` without being rebuilt for each.
  base: './',
  build: {
    outDir: 'dist',
    // Not the default `assets/`, which is where `public/assets/` lands: the GLBs
    // and the bundles would share a directory and only stay apart by luck of
    // filename.
    assetsDir: 'build',
    // The GLBs and thumbnails are already in `public/` and get copied verbatim;
    // nothing here needs inlining, and a base64 GLB would be a catastrophe.
    assetsInlineLimit: 0,
    // three plus drei is a megabyte and there is no version of this page that
    // does not ship a renderer. It is split out of the landing chunk, which is
    // the part that matters, so the warning is noise rather than news.
    chunkSizeWarningLimit: 1100,
  },
});
