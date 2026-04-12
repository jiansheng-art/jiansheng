import process from 'node:process';
import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '../../.env', quiet: true });
dotenv.config({ path: '../../.env.local', override: true, quiet: true });
dotenv.config({ quiet: true });
dotenv.config({ path: '.env.local', override: true, quiet: true });

const envSchema = z.object({
  DATABASE_URL: z.url(),

  S3_SERVER_URL: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_PUBLIC_BASE_URL: z.url(),

  STRIPE_SECRET_KEY: z.string(),
  STRIPE_CHECKOUT_SUCCESS_URL: z.url(),
  STRIPE_CHECKOUT_CANCEL_URL: z.url(),

  TOKEN_EXPIRATION_TIME: z.string().default('24h'),

  VERCEL_BUILD_HOOK_URL: z.url().optional(),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('[ERROR] Invalid environment variables:', z.treeifyError(envParse.error));
  process.exit(1);
}

export const env = envParse.data;
