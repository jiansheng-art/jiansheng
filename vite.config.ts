import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    ignorePatterns: ['.github/**', '**/.nuxt/**', '**/.output/**', '**/.agents/**'],
    singleQuote: true,
    sortImports: true,
  },
  lint: {
    ignorePatterns: ['.github/**', '**/.nuxt/**', '**/.output/**', '**/.agents/**'],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
