import { defineConfig, type PluginOption } from 'vite';
import monkey from 'vite-plugin-monkey';

import { buildAddons } from './scripts/build-addons.mjs';

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
    // The thin build clears dist; the fat one carries a distinct filename and
    // lands beside it, so a thin-then-fat run leaves both artifacts standing.
    build: { minify: true, emptyOutDir: !fat },
    define: { __FAT__: JSON.stringify(fat) },
    plugins: [
      // Thin dev serves add-on artifacts from public/addons; build and watch them
      // so source edits reach the running loader without a manual rebuild.
      !fat &&
        ({
          name: 'sixpack:serve-addons',
          apply: 'serve',
          configureServer: () => buildAddons({ watch: true }),
        } satisfies PluginOption),
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
          // Download hosts for the File Upload Helper add-on; the managed add-on
          // borrows 6pack's grants, so the list lives here too. Keep in sync with
          // ALLOWED_HOSTS in src/addons/file-upload-helper/download.ts and its
          // `connect` in src/addons/manifest.json.
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
