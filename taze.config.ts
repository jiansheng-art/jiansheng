import { defineConfig } from 'taze';

export default defineConfig({
  write: true,
  install: true,
  recursive: true,
  mode: 'major',
  ignorePaths: [
    '**/node_modules/**',
  ],
})