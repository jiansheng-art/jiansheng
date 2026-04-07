import type { H3Event } from 'h3';
import { getUserFromHeader } from '../utils/auth';

export async function createContext(event: H3Event) {
  const token = getRequestHeader(event, 'Authorization');
  const userAgent = getRequestHeader(event, 'user-agent');
  const user = await getUserFromHeader(token);
  const fingerprint = await getRequestFingerprint(event) ?? '127.0.0.1';

  return {
    user,
    token,
    userAgent,
    event,
    fingerprint,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
