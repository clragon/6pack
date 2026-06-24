import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  publicDir: false,
  build: { outDir: 'public/addons', emptyOutDir: true, minify: true },
  plugins: [
    monkey({
      entry: 'src/addons/sources/entry.ts',
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
