import { readFileSync } from 'node:fs';
import { build } from 'vite';
import monkey from 'vite-plugin-monkey';

const { addons } = JSON.parse(
  readFileSync(new URL('../src/addons/manifest.json', import.meta.url)),
);

const NAMESPACE = 'https://clynamic.net';
const MATCH = ['https://e621.net/*', 'https://e926.net/*'];

for (const [index, addon] of addons.entries()) {
  await build({
    configFile: false,
    publicDir: false,
    build: {
      outDir: 'public/addons',
      emptyOutDir: index === 0,
      minify: true,
    },
    plugins: [
      monkey({
        entry: addon.entry,
        build: { fileName: addon.file },
        userscript: {
          name: `6pack add-on: ${addon.name}`,
          description: addon.description,
          namespace: NAMESPACE,
          icon: addon.icon,
          match: MATCH,
        },
      }),
    ],
  });
}
