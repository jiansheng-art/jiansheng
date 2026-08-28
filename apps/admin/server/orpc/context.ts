import type { H3Event } from 'h3';

import { auth } from '../utils/auth';

export async function createContext(event: H3Event) {
  const authSession = await auth.api.getSession({
    headers: event.headers,
  });

  return { authSession };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
