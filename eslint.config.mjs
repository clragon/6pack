import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// The fat build's EMBEDDED map mirrors manifest.json but can't derive from it
// (static imports drive tree-shaking), and TS widens JSON ids to string so a
// type can't guard it. This rule flags any manifest add-on missing from EMBEDDED,
// which would silently drop it from the fat bundle.
const local = {
  rules: {
    'manifest-embedded-sync': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        return {
          'VariableDeclarator[id.name="EMBEDDED"] > ObjectExpression'(node) {
            const manifestPath = resolve(
              dirname(context.filename),
              '../../addons/manifest.json',
            );
            let ids;
            try {
              ids = JSON.parse(readFileSync(manifestPath, 'utf8')).addons.map(
                (addon) => addon.id,
              );
            } catch {
              return;
            }
            const keys = new Set(
              node.properties.map((prop) =>
                prop.key.type === 'Literal' ? prop.key.value : prop.key.name,
              ),
            );
            for (const id of ids)
              if (!keys.has(id))
                context.report({
                  node,
                  message: `EMBEDDED is missing add-on "${id}" from manifest.json; the fat build would drop it.`,
                });
          },
        };
      },
    },
  },
};

export default tseslint.config(
  {
    ignores: ['node_modules/', 'dist/', 'public/addons/', 'legacy/'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'TemplateElement[value.raw=/[.#][\\w-]+[^{}]*\\{[^{}]*:[^{}]*;[^{}]*\\}/]',
          message:
            'CSS in a template literal ships unminified. Move it to a .css file and import with `?inline`.',
        },
      ],
    },
  },
  {
    files: ['src/core/addons/embedded.ts'],
    plugins: { local },
    rules: { 'local/manifest-embedded-sync': 'error' },
  },
  prettier,
);
