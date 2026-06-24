import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// Builds each add-on as a normal userscript. 6pack fetches and evals it for the
// managed (clutter-free, lifecycle-owned) path; the same file is also directly
// installable standalone. One artifact, two ways to load. Output where the dev
// server serves it; the main build copies public/ into dist for release.
export default defineConfig({
  publicDir: false,
  build: { outDir: 'public/addons', emptyOutDir: true, minify: true },
  plugins: [
    monkey({
      entry: 'src/addons/sources/entry.ts',
      // Without this the file is named from package.json ("6pack.user.js").
      build: { fileName: 'source-shortener.user.js' },
      userscript: {
        name: '6pack add-on: Source shortener',
        namespace: 'https://clynamic.net',
        icon: '🔗',
        match: ['https://e621.net/*', 'https://e926.net/*'],
      },
    }),
  ],
});
