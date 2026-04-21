import { drizzle } from 'drizzle-orm/neon-serverless';
import { env } from './env';
import * as schema from './schema';
import ws from 'ws';

export const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL,
  },
  schema,
  ws,
});
