import { readFileSync } from 'node:fs';
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

for (const [index, addon] of addons.entries()) {
  await build({
    configFile: false,
    publicDir: false,
    build: {
      outDir: 'public/addons',
      // Clear the dir once, then accumulate the rest beside it.
      emptyOutDir: index === 0,
      minify: true,
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
          icon: addon.icon,
          match: MATCH,
        },
      }),
    ],
  });
}
