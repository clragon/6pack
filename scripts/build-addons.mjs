import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import monkey from 'vite-plugin-monkey';

const { addons } = JSON.parse(
  readFileSync(new URL('../src/addons/manifest.json', import.meta.url)),
);

const NAMESPACE = 'https://clynamic.net';
const MATCH = ['https://e621.net/*', 'https://e926.net/*'];

function firstBuild(watcher) {
  return new Promise((resolve, reject) => {
    watcher.on('event', (event) => {
      if (event.code === 'END') resolve();
      else if (event.code === 'ERROR') reject(event.error);
    });
  });
}

export async function buildAddons({ watch = false } = {}) {
  for (const [index, addon] of addons.entries()) {
    const result = await build({
      configFile: false,
      publicDir: false,
      build: {
        outDir: 'public/addons',
        // vite empties outDir again on every watch rebuild, which would wipe
        // the sibling artifacts.
        emptyOutDir: !watch && index === 0,
        minify: true,
        watch: watch ? {} : null,
      },
      plugins: [
        monkey({
          entry: addon.entry,
          build: { fileName: addon.file },
          userscript: {
            name: `6pack add-on: ${addon.name}`,
            description: addon.description,
            namespace: NAMESPACE,
            match: MATCH,
          },
        }),
      ],
    });
    if (watch) await firstBuild(result);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildAddons({ watch: process.argv.includes('--watch') });
}
