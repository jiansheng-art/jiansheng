import { defineConfig } from 'drizzle-kit';
import { env } from '../../packages/shared/src/env.ts';

export default defineConfig({
  out: './drizzle',
  schema: '../../packages/shared/src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
