import type { H3Event } from 'h3';

export async function createContext(event: H3Event) {
  const fingerprint = await getRequestFingerprint(event) ?? '127.0.0.1';

  return {
    fingerprint,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
