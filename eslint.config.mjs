// @ts-check
// The rules of AGENTS.md › «Código limpio» that a machine can check. The rest is review (sdd-verify).
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['public/**', '.output/**', '.wxt/**', 'dist/**', 'out-tsc/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // D29 in every product: no console.* left behind.
      'no-console': 'error',
      'no-nested-ternary': 'error',
    },
  },
  {
    // engine/ is plain TypeScript: it receives data and returns data.
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@angular/*', '@jsverse/*', '@ng-icons/*', 'rxjs', 'rxjs/*', 'wxt', 'wxt/*'],
              message: 'engine/ is plain TypeScript, without Angular or WXT (AGENTS.md › Arquitectura).',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'chrome', message: 'engine/ never calls Chrome: an adapter does (AGENTS.md › Arquitectura).' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // «Nunca en la plantilla: ternarios anidados ni cálculos de varios pasos».
      '@angular-eslint/template/conditional-complexity': ['error', { maxComplexity: 3 }],
    },
  },
);
