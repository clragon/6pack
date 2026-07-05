import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';

const RULE = /[.#][\w-]+[^{}`]*\{[^{}`]*:[^{}`]*;[^{}`]*\}/;

const files = globSync('src/**/*.{ts,tsx}', {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
});

const offenders = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const segments = text.split('`');
  for (let i = 1; i < segments.length; i += 2) {
    if (RULE.test(segments[i])) {
      offenders.push(file);
      break;
    }
  }
}

if (offenders.length) {
  console.error('CSS written as a template literal (ships unminified):');
  for (const file of offenders) console.error(`  ${file}`);
  console.error('Move it to a .css file and import with `?inline`.');
  process.exit(1);
}
