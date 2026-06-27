import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig(({ mode }) => {
  const fat = mode === 'fat';
  return {
    server: { port: 5837 },
    publicDir: fat ? false : 'public',
    build: { minify: true },
    define: { __FAT__: JSON.stringify(fat) },
    plugins: [
      monkey({
        entry: 'src/main.ts',
        build: fat ? { fileName: '6pack.fat.user.js' } : undefined,
        userscript: {
          name: fat ? '6 P.A.C.K. (fat)' : '6 P.A.C.K.',
          namespace: 'https://clynamic.net',
          'run-at': 'document-start',
          icon: 'https://em-content.zobj.net/source/microsoft-3D-fluent/433/fire-extinguisher_1f9ef.png',
          match: ['https://e621.net/*', 'https://e926.net/*'],
          // The managed File Upload Helper borrows these grants, so this list
          // mirrors ALLOWED_HOSTS in src/addons/file-upload-helper/download.ts.
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
  };
});
