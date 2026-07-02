import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import monkey from 'vite-plugin-monkey';

// Builds each managed add-on as its own userscript artifact into public/addons,
// from the same manifest the runtime catalog reads (single source of truth).
// vite-plugin-monkey is one userscript per build, so we loop. Each artifact is
// fetched and eval'd by 6pack (managed) and is also standalone-installable.
const { addons } = JSON.parse(
  readFileSync(new URL('../src/addons/manifest.json', import.meta.url)),
);

const NAMESPACE = 'https://clynamic.net';
const MATCH = ['https://e621.net/*', 'https://e926.net/*'];

// Resolves once the watcher has written its first bundle, so callers can wait for
// the artifacts to exist before serving them.
function firstBuild(watcher) {
  return new Promise((resolve, reject) => {
    watcher.on('event', (event) => {
      if (event.code === 'END') resolve();
      else if (event.code === 'ERROR') reject(event.error);
    });
  });
}

// Build every add-on artifact. In watch mode each keeps rebuilding on source
// change, and the returned promise settles once all have built once.
export async function buildAddons({ watch = false } = {}) {
  for (const [index, addon] of addons.entries()) {
    const result = await build({
      configFile: false,
      publicDir: false,
      build: {
        outDir: 'public/addons',
        // Clear the dir once, then accumulate the rest beside it. Never in watch:
        // a rebuild would wipe the sibling artifacts.
        emptyOutDir: !watch && index === 0,
        minify: true,
        watch: watch ? {} : null,
      },
      plugins: [
        monkey({
          entry: addon.entry,
          build: { fileName: addon.file },
          userscript: {
            // Prefix so it's identifiable among installed scripts; the catalog
            // shows the bare name.
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

// Run directly (npm run build:addons) for a one-shot build.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildAddons({ watch: process.argv.includes('--watch') });
}
