import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { env } from './env';
import * as schema from './schema';

export const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
  },
  schema,
  ws,
});
