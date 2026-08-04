import { defineConfig, type PluginOption } from 'vite';
import monkey from 'vite-plugin-monkey';

import { buildAddons } from './scripts/build-addons.mjs';

const REPO = process.env.GITHUB_REPOSITORY ?? 'clragon/6pack';
const RELEASE = `https://github.com/${REPO}/releases`;

function addonBase(serving: boolean): string {
  if (serving) return 'http://127.0.0.1:5837/addons/';
  const tag = process.env.RELEASE_TAG;
  return tag ? `${RELEASE}/download/${tag}/` : `${RELEASE}/latest/download/`;
}

export default defineConfig(({ command, mode }) => {
  const fat = mode === 'fat';
  return {
    server: { port: 5837 },
    publicDir: fat ? false : 'public',
    build: { minify: true, emptyOutDir: !fat },
    define: {
      __FAT__: JSON.stringify(fat),
      __ADDON_BASE__: JSON.stringify(addonBase(command === 'serve')),
    },
    plugins: [
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
          'run-at': 'document-start',
          icon: 'https://em-content.zobj.net/source/microsoft-3D-fluent/433/fire-extinguisher_1f9ef.png',
          match: ['https://e621.net/*', 'https://e926.net/*'],
          updateURL: `${RELEASE}/latest/download/${fat ? '6pack.fat.user.js' : '6pack.user.js'}`,
          downloadURL: `${RELEASE}/latest/download/${fat ? '6pack.fat.user.js' : '6pack.user.js'}`,
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
            // GitHub redirects a release download to an asset host, and
            // Tampermonkey checks @connect against the initial and final url.
            'github.com',
            'release-assets.githubusercontent.com',
            'objects.githubusercontent.com',
          ],
        },
      }),
    ],
  };
});
