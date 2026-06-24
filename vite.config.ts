import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  server: { port: 5837 },
  build: { minify: true },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: '6 P.A.C.K.',
        namespace: 'https://clynamic.net',
        icon: '🛠️',
        match: ['https://e621.net/*', 'https://e926.net/*'],
        connect: [
          'twimg.com',
          'pximg.net',
          'furaffinity.net',
          'facdn.net',
          'wixmp.com',
          'derpicdn.net',
          'metapix.net',
          'discordapp.com',
          'discordapp.net',
          'imgur.com',
          'sofurryfiles.com',
          'weasyl.com',
          'bsky.app',
          'e621.net',
          'e926.net',
          '127.0.0.1',
          'localhost',
        ],
      },
    }),
  ],
});
