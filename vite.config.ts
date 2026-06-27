import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig(({ mode }) => {
  // Fat build (`--mode fat`): add-ons are compiled in, so it ships as one
  // self-contained userscript with no runtime fetch. The default thin build
  // fetches enabled add-on artifacts from the add-on server instead.
  const fat = mode === 'fat';
  return {
    server: { port: 5837 },
    // A fat build is self-contained, so it carries none of the separately-built
    // add-on artifacts from public/addons.
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
          // Boot before first paint so CSS-driven add-ons can land early; the
          // DOM-dependent boot waits for the parse via whenReady in main.ts.
          'run-at': 'document-start',
          icon: 'https://em-content.zobj.net/source/microsoft-3D-fluent/433/fire-extinguisher_1f9ef.png',
          match: ['https://e621.net/*', 'https://e926.net/*'],
          // Hosts the "Fix file upload" command may download from; keep in sync
          // with ALLOWED_HOSTS in src/core/download.ts.
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
            // Dev: the vite server that serves managed add-on artifacts from
            // public/addons (see src/core/addons/loader.ts).
            '127.0.0.1',
            'localhost',
          ],
        },
      }),
    ],
  };
});
